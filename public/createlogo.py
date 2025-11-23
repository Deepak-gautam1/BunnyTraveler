import os
import sys

print("--- 1. Script Starting ---")

try:
    # Try importing Pillow
    from PIL import Image
    import zipfile
    print("--- 2. Pillow Library Imported Successfully ---")
except ImportError as e:
    print("!!! CRITICAL ERROR: Pillow is not installed in this Python environment. !!!")
    print(f"Error details: {e}")
    sys.exit(1)

def create_icons_zip(source_image_name, output_zip_name="icons.zip"):
    # Get the current folder where this script is running
    current_folder = os.getcwd()
    full_image_path = os.path.join(current_folder, source_image_name)

    print(f"--- 3. Looking for image at: {full_image_path}")

    if not os.path.exists(full_image_path):
        print("\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        print(f"ERROR: Cannot find the file '{source_image_name}'")
        print("Please check:")
        print("1. Is the file name spelled EXACTLY right?")
        print("2. Is the extension .png or .jpg?")
        print(f"3. Is it inside this folder: {current_folder} ?")
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")
        return

    print("--- 4. Image found! Processing...")
    
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    try:
        with Image.open(full_image_path) as img:
            img = img.convert("RGBA")
            
            with zipfile.ZipFile(output_zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for size in sizes:
                    filename = f"icon-{size}x{size}.png"
                    resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
                    resized_img.save(filename)
                    zipf.write(filename)
                    os.remove(filename) # Clean up
                    print(f"   -> Created {filename}")
            
        print(f"\n--- SUCCESS! Created {output_zip_name} ---")
        print(f"File location: {os.path.join(current_folder, output_zip_name)}")

    except Exception as e:
        print(f"Error during processing: {e}")

# --- IMPORTANT ---
# MAKE SURE THIS MATCHES YOUR IMAGE NAME EXACTLY
# If your image is "logo.jpg", change this line to "logo.jpg"
image_filename = "logo.png" 

if __name__ == "__main__":
    create_icons_zip(image_filename)