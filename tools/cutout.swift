// Cut an illustration out of its plain white background, for the game's art (assets/art/*.png).
//
//   swiftc -O tools/cutout.swift -o /tmp/cutout   (on this Mac, add -sdk /Library/Developer/CommandLineTools/SDKs/MacOSX26.5.sdk)
//   /tmp/cutout in.jpg out.png [maxHeight=520] [threshold=245]
//
// The white is flood-filled in from the edges, so white things inside the drawing (a pile of flour) stay. Pixels
// touching the background fade by how close to white they are, so the edge isn't jagged. Then the result is
// cropped to what's left and scaled down to maxHeight.
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count >= 3 else {
    print("usage: cutout in out.png [maxHeight] [threshold]")
    exit(1)
}
let sRGB = CGColorSpace(name: CGColorSpace.sRGB)!

guard let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: args[1]) as CFURL, nil),
      let cg = CGImageSourceCreateImageAtIndex(src, 0, nil) else { fatalError("cannot read \(args[1])") }
let maxH = args.count > 3 ? Double(args[3]) ?? 520 : 520
let threshold = args.count > 4 ? Int(args[4]) ?? 245 : 245

let w = cg.width, h = cg.height
var px = [UInt8](repeating: 0, count: w * h * 4)
let ctx = CGContext(data: &px, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: sRGB,
                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))
func minChannel(_ i: Int) -> Int { Int(min(px[i * 4], px[i * 4 + 1], px[i * 4 + 2])) }

var bg = [Bool](repeating: false, count: w * h)
var stack: [Int] = []
for x in 0..<w { stack.append(x); stack.append((h - 1) * w + x) }
for y in 0..<h { stack.append(y * w); stack.append(y * w + w - 1) }
while let i = stack.popLast() {
    if bg[i] || minChannel(i) < threshold { continue }
    bg[i] = true
    let x = i % w, y = i / w
    if x > 0 { stack.append(i - 1) }
    if x < w - 1 { stack.append(i + 1) }
    if y > 0 { stack.append(i - w) }
    if y < h - 1 { stack.append(i + w) }
}

var minX = w, minY = h, maxX = 0, maxY = 0
for y in 0..<h {
    for x in 0..<w {
        let i = y * w + x
        if bg[i] {
            for c in 0..<4 { px[i * 4 + c] = 0 }
            continue
        }
        let edge = (x > 0 && bg[i - 1]) || (x < w - 1 && bg[i + 1]) || (y > 0 && bg[i - w]) || (y < h - 1 && bg[i + w])
        if edge {
            let a = min(1.0, Double(255 - minChannel(i)) / Double(255 - threshold + 30))
            for c in 0..<4 { px[i * 4 + c] = UInt8(Double(px[i * 4 + c]) * a) }
        }
        minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y)
    }
}

let full = ctx.makeImage()!
let crop = full.cropping(to: CGRect(x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1))!
let s = min(1.0, maxH / Double(crop.height))
let ow = Int((Double(crop.width) * s).rounded()), oh = Int((Double(crop.height) * s).rounded())
let out = CGContext(data: nil, width: ow, height: oh, bitsPerComponent: 8, bytesPerRow: 0, space: sRGB,
                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
out.interpolationQuality = .high
out.draw(crop, in: CGRect(x: 0, y: 0, width: ow, height: oh))
guard let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: args[2]) as CFURL, UTType.png.identifier as CFString, 1, nil) else { fatalError("cannot write \(args[2])") }
CGImageDestinationAddImage(dest, out.makeImage()!, nil)
guard CGImageDestinationFinalize(dest) else { fatalError("could not save \(args[2])") }
print("\(args[2]) \(ow)x\(oh)")
