// import multer from "multer";
// import { CloudinaryStorage } from "multer-storage-cloudinary";
// import cloudinary from "../config/cloudinary.js";

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: "session_images", // folder in Cloudinary
//     allowed_formats: ["jpg", "jpeg", "png"],
//   },
// });

// export const upload = multer({ storage });

import multer from "multer";

const storage = multer.diskStorage({});

export const upload = multer({ storage });

