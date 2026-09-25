import zlib
import struct
import os

def create_png(width, height, draw_fn, output_path):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type 0 (None)
        for x in range(width):
            r, g, b, a = draw_fn(x, y, width, height)
            raw_data.extend([r, g, b, a])
    
    compressed = zlib.compress(bytes(raw_data), 9)
    
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    
    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff)
    png.extend(struct.pack('>I', len(ihdr_data)))
    png.extend(b'IHDR')
    png.extend(ihdr_data)
    png.extend(ihdr_crc)
    
    # IDAT
    idat_crc = struct.pack('>I', zlib.crc32(b'IDAT' + compressed) & 0xffffffff)
    png.extend(struct.pack('>I', len(compressed)))
    png.extend(b'IDAT')
    png.extend(compressed)
    png.extend(idat_crc)
    
    # IEND
    iend_crc = struct.pack('>I', zlib.crc32(b'IEND') & 0xffffffff)
    png.extend(struct.pack('>I', 0))
    png.extend(b'IEND')
    png.extend(iend_crc)
    
    with open(output_path, 'wb') as f:
        f.write(png)
    print(f"Generated {output_path} ({width}x{height})")

def icon_pixel(x, y, w, h):
    # Normalized coords from center [-1, 1]
    nx = (x - w / 2) / (w / 2)
    ny = (y - h / 2) / (h / 2)
    dist = (nx**2 + ny**2)**0.5
    
    # Dark carbon background
    bg_r, bg_g, bg_b = 15, 17, 23
    
    # Outer bezel glow ring
    if 0.78 < dist < 0.92:
        glow = max(0.0, 1.0 - abs(dist - 0.85) / 0.07)
        r = int(bg_r * (1 - glow) + 245 * glow)
        g = int(bg_g * (1 - glow) + 158 * glow)
        b = int(bg_b * (1 - glow) + 11 * glow)
        return (r, g, b, 255)
    
    # Flashlight bezel housing
    if dist <= 0.78:
        # Radial gradient inside lens
        lens_glow = max(0.0, 1.0 - dist / 0.78)
        
        # Center flashlight beam / bolt shape
        # Flashlight cone or bolt
        is_bolt = False
        # Lightning bolt coords
        if (-0.2 < nx < 0.3) and (-0.6 < ny < 0.6):
            if ny < -0.1 and nx < (0.15 - ny * 0.4):
                is_bolt = True
            elif ny >= -0.1 and nx > (-0.15 - ny * 0.35) and nx < (0.25 - ny * 0.2):
                is_bolt = True

        if is_bolt:
            return (255, 235, 100, 255) # Bright electric amber/gold
        
        # Lens background
        lr = int(24 + 180 * (lens_glow ** 2.5))
        lg = int(28 + 140 * (lens_glow ** 2.5))
        lb = int(36 + 40 * (lens_glow ** 2.5))
        return (min(255, lr), min(255, lg), min(255, lb), 255)
        
    return (bg_r, bg_g, bg_b, 255)

os.makedirs('public', exist_ok=True)
create_png(192, 192, icon_pixel, 'public/pwa-192x192.png')
create_png(512, 512, icon_pixel, 'public/pwa-512x512.png')
create_png(512, 512, icon_pixel, 'public/pwa-maskable-512x512.png')
create_png(180, 180, icon_pixel, 'public/apple-touch-icon.png')
