// Turns recorded frames into an MP4 (H.264), with the Mac's own video encoder. No other software needed.
//
//   encode out.mp4 fps bitrate frames/clipA [frames/clipB …]
//
// Frames are the JPEGs in each folder, in name order; several folders are joined one after another (the full video).
// bitrate is in bits a second (4000000 is about 30 MB a minute at 1920 × 1080). video/tools/make-videos.sh runs it.
import AVFoundation
import CoreGraphics
import Foundation
import ImageIO

let args = CommandLine.arguments
guard args.count >= 5, let fps = Int32(args[2]), let bitrate = Int(args[3]) else {
    print("usage: encode out.mp4 fps bitrate framesFolder [framesFolder …]")
    exit(1)
}
let out = URL(fileURLWithPath: args[1])
var files: [URL] = []
for folder in args.dropFirst(4) {
    let names = (try? FileManager.default.contentsOfDirectory(atPath: folder)) ?? []
    files += names.filter { $0.hasSuffix(".jpg") }.sorted().map { URL(fileURLWithPath: folder).appendingPathComponent($0) }
}
guard let first = files.first,
      let firstImage = CGImageSourceCreateImageAtIndex(CGImageSourceCreateWithURL(first as CFURL, nil)!, 0, nil) else {
    print("no frames in \(args.dropFirst(4).joined(separator: ", "))")
    exit(1)
}
let w = firstImage.width, h = firstImage.height

try? FileManager.default.removeItem(at: out)
let writer = try AVAssetWriter(outputURL: out, fileType: .mp4)
let settings: [String: Any] = [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: w,
    AVVideoHeightKey: h,
    AVVideoColorPropertiesKey: [
        AVVideoColorPrimariesKey: AVVideoColorPrimaries_ITU_R_709_2,
        AVVideoTransferFunctionKey: AVVideoTransferFunction_ITU_R_709_2,
        AVVideoYCbCrMatrixKey: AVVideoYCbCrMatrix_ITU_R_709_2,
    ],
    AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: bitrate,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
        AVVideoMaxKeyFrameIntervalKey: Int(fps) * 2,
    ],
]
let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
    kCVPixelBufferWidthKey as String: w,
    kCVPixelBufferHeightKey as String: h,
])
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

let space = CGColorSpace(name: CGColorSpace.sRGB)!
for (i, file) in files.enumerated() {
    autoreleasepool {
        while !input.isReadyForMoreMediaData { usleep(2000) }
        guard let src = CGImageSourceCreateWithURL(file as CFURL, nil), let image = CGImageSourceCreateImageAtIndex(src, 0, nil) else {
            print("skipped \(file.lastPathComponent): can't read it")
            return
        }
        var buffer: CVPixelBuffer?
        CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &buffer)
        guard let pb = buffer else { return }
        CVPixelBufferLockBaseAddress(pb, [])
        let ctx = CGContext(data: CVPixelBufferGetBaseAddress(pb), width: w, height: h, bitsPerComponent: 8,
                            bytesPerRow: CVPixelBufferGetBytesPerRow(pb), space: space,
                            bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)!
        ctx.draw(image, in: CGRect(x: 0, y: 0, width: w, height: h))
        CVPixelBufferUnlockBaseAddress(pb, [])
        adaptor.append(pb, withPresentationTime: CMTime(value: Int64(i), timescale: fps))
    }
}
input.markAsFinished()
let done = DispatchSemaphore(value: 0)
writer.finishWriting { done.signal() }
done.wait()
if writer.status == .completed {
    let size = (try? FileManager.default.attributesOfItem(atPath: out.path)[.size] as? Int) ?? 0
    let seconds = Double(files.count) / Double(fps)
    print(String(format: "%@  %d frames, %.1f s, %.1f MB", out.lastPathComponent, files.count, seconds, Double(size) / 1_000_000))
} else {
    print("failed: \(writer.error?.localizedDescription ?? "unknown error")")
    exit(1)
}
