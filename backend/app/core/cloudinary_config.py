import os

import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True,
)


def upload_to_cloudinary(file_obj, folder: str, resource_type: str = "auto") -> str:
    """Uploads a file-like object to Cloudinary and returns its secure URL.

    resource_type: 'image', 'video', 'raw' (pdf/doc/etc), or 'auto' to let
    Cloudinary detect it.
    """
    result = cloudinary.uploader.upload(
        file_obj,
        folder=folder,
        resource_type=resource_type,
    )
    return result["secure_url"]
