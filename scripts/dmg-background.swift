// Regenerate with: swift scripts/dmg-background.swift
import AppKit

// Finder may display tabs, a path bar, and a status bar over the canvas.
// Reserve 140 points below the instructions for that window chrome.
let width = 760, height = 740
let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: width, pixelsHigh: height,
    bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
    colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
let ink = NSColor(calibratedRed: 0.12, green: 0.17, blue: 0.25, alpha: 1)
let blue = NSColor(calibratedRed: 0.12, green: 0.34, blue: 0.78, alpha: 1)
func box(_ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat, _ color: NSColor, _ radius: CGFloat = 0) {
    color.setFill()
    NSBezierPath(roundedRect: NSRect(x: x, y: CGFloat(height)-y-h, width: w, height: h), xRadius: radius, yRadius: radius).fill()
}
func text(_ value: String, _ x: CGFloat, _ y: CGFloat, _ size: CGFloat, _ bold: Bool = false, _ color: NSColor = NSColor.labelColor) {
    let font = NSFont.systemFont(ofSize: size, weight: bold ? .semibold : .regular)
    (value as NSString).draw(at: NSPoint(x: x, y: CGFloat(height)-y-size-5), withAttributes: [.font: font, .foregroundColor: color])
}
box(0, 0, 760, 740, NSColor(calibratedWhite: 0.97, alpha: 1))
text("AI PagePolish", 40, 26, 30, true, ink)
text("by PageTweaker", 42, 66, 14, false, ink)
text("1  Drag the app into Applications", 40, 113, 21, true, ink)
// Real Finder icons occupy the open area at (190, 215) and (570, 215).
box(315, 207, 115, 5, blue, 2)
let arrow = NSBezierPath()
arrow.move(to: NSPoint(x: 416, y: CGFloat(height)-196)); arrow.line(to: NSPoint(x: 431, y: CGFloat(height)-210))
arrow.line(to: NSPoint(x: 416, y: CGFloat(height)-224)); arrow.lineWidth = 5
blue.setStroke(); arrow.stroke()
text("2  Open the app from Applications", 40, 320, 21, true, ink)
text("After copying, eject this disk image. Open your installed app.", 40, 352, 16, false, ink)
box(24, 399, 712, 180, .white, 14)
text("If macOS blocks the first launch", 40, 416, 19, true, ink)
text("This app is not Apple notarized. If you trust this download:", 40, 449, 14, false, ink)
text("System Settings → Privacy & Security", 40, 479, 17, true, blue)
text("Click Open Anyway, then follow the confirmation prompts.", 40, 509, 14, false, ink)
text("Try opening the installed app first so the option appears.", 40, 540, 13, false, ink)
NSGraphicsContext.restoreGraphicsState()
try bitmap.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: "assets/dmg-background.png"))
