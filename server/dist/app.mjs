import dotenv, { config } from "dotenv";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import joi from "joi";
import bcrypt from "bcrypt";
import { v4 } from "uuid";
import nodemailer from "nodemailer";
import uniqid from "uniqid";
import moment from "moment";
import qs$1 from "qs";
import crypto$1 from "crypto";
import { v2 } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
const connectDB = async (uri = 'mongodb+srv://nvhoan11092003:Hoan1109@cluster0.yvldvoj.mongodb.net/') => {
  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err2) {
    console.error(`Error: ${err2.message}`);
    process.exit(1);
  }
};
const userSchema = new mongoose.Schema(
  {
    name: {
      type: Schema.Types.String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    isVerifyEmail: {
      type: Boolean,
      default: false
    },
    password: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      sparse: true
    },
    address: {
      type: String,
      required: false
    },
    Address: {
      type: String,
      required: false
    },
    country: {
      type: String,
      require: false
    },
    image: {
      type: String,
      required: false
    },
    cart: { type: mongoose.Schema.Types.ObjectId, ref: "Cart" },
    wishList: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    vouchers: [{
      type: mongoose.Schema.Types.ObjectId,
      // Hoặc Schema.Types.String nếu bạn lưu trữ dưới dạng chuỗi
      ref: "voucher"
      // Tham chiếu tới mô hình Voucher nếu đây là ObjectId
    }],
    orders: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Order"
      }
    ],
    isBlocked: {
      type: Boolean,
      default: false
    },
    comments: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Comment"
      }
    ],
    role: {
      type: String,
      enum: ["User", "Admin"],
      default: "User"
    }
  },
  { timestamps: true, versionKey: false }
);
const User = mongoose.model("User", userSchema);
const authMiddlware = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập"
      });
    }
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        message: "Người dùng không tồn tại"
      });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        message: "Token đã hết hạn!"
      });
    } else if (error instanceof jwt.NotBeforeError) {
      return res.status(401).json({
        message: "Token chưa có hiệu lực!"
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        message: "Token không hợp lệ!"
      });
    }
    console.error(error);
    return res.status(500).json({
      message: "Đã có lỗi xảy ra!"
    });
  }
};
const isAdmin = async (req, res, next) => {
  const { email } = req.user;
  const users = await User.findOne({ email });
  if ((users == null ? void 0 : users.role) !== "Admin") {
    res.status(401).json({ message: "bạn không có quyền truy cập  " });
  } else {
    next();
  }
};
const errorMessages = (fieldName) => {
  return {
    "string.base": `${fieldName} phải là chuỗi`,
    "string.empty": `${fieldName} không được để trống`,
    "string.email": `${fieldName} phải là email`,
    "string.min": `${fieldName} phải dài hơn 6 ký tự`,
    "number.base": `${fieldName} phải là số`,
    "number.empty": `${fieldName} là bắt buộc`,
    "number.min": `${fieldName} phải lớn hơn 0`,
    "number.max": `${fieldName} phải nhỏ hơn hoặc bằng giá trị tối đa`,
    "array.base": `${fieldName} phải là mảng`,
    "array.min": `${fieldName} không được để trống`,
    "object.base": `${fieldName} phải là đối tượng`,
    "any.required": `${fieldName} là bắt buộc`,
    "any.only": `${fieldName} không khớp`
  };
};
const productSchema$1 = joi.object({
  sold: joi.number().min(0).default(0).messages(errorMessages("đã bán")),
  name: joi.string().required().messages(errorMessages("Tên")),
  price: joi.number().min(0).required().messages(errorMessages("Giá")),
  description: joi.string().required().messages(errorMessages("Mô tả")),
  // images: joi
  //   .array()
  //   .min( 1 )
  //   .required()
  //   .items(
  //     joi.object( {
  //       uid: joi.string().required().messages( errorMessages( "Uid" ) ),
  //       url: joi.string().required().messages( errorMessages( "Đường dẫn" ) ),
  //     } )
  //   )
  // .messages( errorMessages( "Ảnh" ) ),
  ProductVariants: joi.array().required(),
  category: joi.string().required().messages(errorMessages("Danh mục")),
  brand: joi.string().required().messages(errorMessages("thương hiệu ")),
  comments: joi.any()
}).unknown(true);
const categorySchema$1 = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    image: {
      uid: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      }
    }
  },
  { timestamps: true, versionKey: false }
);
const Category = mongoose.model("Category", categorySchema$1);
const brandSchema$1 = new mongoose.Schema({
  title: {
    type: String,
    require: true
  }
}, { timestamps: true });
const Brand = mongoose.model("Brand", brandSchema$1);
const productVariantSchema$2 = new mongoose.Schema(
  {
    size: {
      type: String,
      required: true
    },
    color: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      min: 0,
      required: true
    }
  }
);
const productSchema = new mongoose.Schema(
  {
    sold: {
      type: Number,
      default: "0",
      required: false
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      min: 0,
      required: true
    },
    original_price: {
      type: Number,
      min: 0
    },
    description: {
      type: String,
      required: true
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true
    },
    images: [
      {
        uid: {
          type: String
        },
        url: {
          type: String
        }
      }
    ],
    ProductVariants: [productVariantSchema$2],
    // Sử dụng mô hình biến thể sản phẩm
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
      }
    ],
    discountProduct: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true, versionKey: false }
);
const Product = mongoose.model("Product", productSchema);
const create$5 = async (req, res) => {
  try {
    const { error } = productSchema$1.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err2) => err2.message);
      return res.status(400).json({
        message: errors
      });
    }
    const checkCategory = await Category.findById(req.body.category);
    if (!checkCategory) {
      return res.status(400).json({
        message: "Danh mục không tồn tại"
      });
    }
    const variantsToBeAdded = req.body.ProductVariants;
    console.log(variantsToBeAdded);
    const duplicateVariants = variantsToBeAdded.filter(
      (variant, index, self) => index !== self.findIndex((v) => v.size === variant.size && v.color === variant.color)
    );
    if (duplicateVariants.length > 0) {
      return res.status(400).json({
        message: `Bạn đã nhập 2 trường biến thể giống nhau Size ${variantsToBeAdded[0].size} và Màu ${variantsToBeAdded[0].color}. Vui lòng nhập lại.`
      });
    }
    const data = await Product.create({
      name: req.body.name,
      price: req.body.price,
      original_price: req.body.original_price,
      description: req.body.description,
      brand: req.body.brand,
      images: req.body.images,
      category: req.body.category,
      comments: req.body.comments,
      ProductVariants: variantsToBeAdded
    });
    if (data) {
      return res.status(200).json({
        message: "Thêm sản phẩm và biến thể thành công",
        data
      });
    } else {
      return res.status(404).json({
        message: "Thêm sản phẩm thất bại"
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const getAll$6 = async (req, res) => {
  try {
    const queryObj = { ...req.query };
    const excludeFields = ["page", "sort", "limit", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    let query = Product.find(JSON.parse(queryStr));
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.select("-__v");
    }
    if (req.query.category) {
      queryObj.category = req.query.category;
    }
    const page = req.query.page;
    const limit = req.query.limit;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);
    if (req.query.page) {
      const productCount = await Product.countDocuments();
      if (skip >= productCount)
        throw new Error("This page does not exist");
    }
    console.log(page, limit, skip);
    query = query.populate("category").populate("brand").populate("ProductVariants").sort({ createdAt: -1 });
    const products = await query;
    res.status(200).json({
      products
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error: " + error.message
    });
  }
};
const locproduct = async (req, res) => {
  const { category, brand, minPrice, maxPrice } = req.query;
  try {
    const queryConditions = {};
    if (category) {
      const foundCategory = await Category.findOne({ title: category });
      if (foundCategory) {
        queryConditions.category = foundCategory._id;
      }
    }
    if (brand) {
      const foundBrand = await Brand.findOne({ title: brand });
      if (foundBrand) {
        queryConditions.brand = foundBrand._id;
      }
    }
    if (minPrice && maxPrice) {
      queryConditions.price = { $gte: minPrice, $lte: maxPrice };
    }
    console.log(queryConditions);
    const products = await Product.find(queryConditions).populate("category").populate("brand");
    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
};
const getOne$6 = async (req, res) => {
  console.log(req.params.id);
  try {
    const data = await Product.findById(req.params.id).populate("category").populate("brand").populate("ProductVariants");
    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "Không có thông tin"
      });
    }
    return res.status(200).json({
      message: "Thông tin sản phẩm",
      data
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const updateProduct = async (req, res) => {
  try {
    const { error } = productSchema$1.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err2) => err2.message);
      return res.status(400).json({
        message: errors
      });
    }
    const checkCategory = await Category.findById(req.body.category);
    if (!checkCategory) {
      return res.status(400).json({
        message: "Danh mục không tồn tại"
      });
    }
    const variantsToBeUpdated = req.body.ProductVariants;
    const duplicateVariants = variantsToBeUpdated.filter(
      (variant, index, self) => index !== self.findIndex(
        (v) => v.size === variant.size && v.color === variant.color
      )
    );
    if (duplicateVariants.length > 0) {
      return res.status(400).json({
        message: `Bạn đã nhập 2 trường biến thể giống nhau Size ${variantsToBeUpdated[0].size} và Màu ${variantsToBeUpdated[0].color}. Vui lòng nhập lại.`
      });
    }
    const data = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });
    if (!data) {
      return res.status(404).json({
        message: "Cập nhật thất bại "
      });
    }
    return res.status(200).json({
      message: "Cập nhật thành công ",
      data
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const remove$6 = async (req, res) => {
  try {
    const data = await Product.findByIdAndDelete(req.params.id);
    if (!data) {
      return res.status(404).json({
        message: "Xóa sản phẩm thất bại"
      });
    }
    return res.status(200).json({
      message: "Xóa sản phẩm thành công "
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const addTowishList = async (req, res) => {
  const { _id } = req.user;
  const { prodId } = req.body;
  try {
    const user = await User.findById(_id);
    const alreadyExists = user.wishList.find((id) => id.toString() === prodId);
    console.log(alreadyExists);
    if (alreadyExists) {
      return res.status(400).json({ message: "Sản phẩm đã tồn tại trong danh sách yêu thích" });
    } else {
      let updatedUser = await User.findByIdAndUpdate(
        _id,
        {
          $push: { wishList: prodId }
        },
        {
          new: true
        }
      );
      res.json(updatedUser);
    }
  } catch (error) {
    throw new Error(error);
  }
};
const router$f = express.Router();
router$f.get("/", getAll$6);
router$f.get("/:id", getOne$6);
router$f.post("/", create$5);
router$f.put("/:id", updateProduct);
router$f.delete("/:id", remove$6);
dotenv.config();
const FormVerify = (name, email, randomCode, verifyEmailUrl) => {
  return (
    /*html*/
    `
        <div style="margin: 5px auto 5px; padding: 5px; max-width: 600px; background: linear-gradient(to left,#7347c1,#0674ec); border: 5px solid transparent; background-repeat: no-repeat; background-origin: padding-box,border-box">
            <table cellpadding="0" cellspacing="0" border="0" align="center" style="background:white">
                <tbody>
                    <table cellpadding="0" cellspacing="0" border="0" align="center" width="600">
                        <tbody>
                            <tr>
                                <td width="100%" colspan="3" align="center" style="padding-bottom:10px;padding-top:25px">
                                    <div align="center">
                                        <h2>Xác minh tài khoản</h2>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td width="100">&nbsp;</td>
                                <td width="400" align="center">
                                    <div align="left">
                                        <p>
                                            Xin chào <b style="color:#0674ec">${name}</b>
                                            <div>&nbsp;</div>
                                            Email: <b style="color:#0674ec">${email}</b>
                                            <div>&nbsp;</div>
                                            Mã bảo mật: <b style="color:red">${randomCode}</b>
                                            <div>&nbsp;</div>
                                            Bấm vào nút <b style="color:#0674ec">Xác Minh</b> bên dưới để xác minh tài khoản<br>
                                            <div>&nbsp;</div>
                                        </p>
                                    </div>
                                </td>
                                <td width="100">&nbsp;</td>
                            </tr>
                        </tbody>
                    </table>
                    <table cellpadding="0" cellspacing="0" border="0" align="center" width="600">
                        <tbody>
                            <tr>
                                <td width="200">&nbsp;</td>
                                <td width="200" align="center" style="padding-top:25px">
                                    <table cellpadding="0" cellspacing="0" border="0" align="center" width="200" height="50">
                                        <tbody>
                                            <tr>
                                                <td bgcolor="#0674ec" align="center" style="border-radius:4px" width="200" height="50">
                                                    <a href=${verifyEmailUrl} target="_blank" style="color: white; text-decoration: none">
                                                        <div align="center">
                                                            <p>Xác minh</p>
                                                        </div>
                                                    </a>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                                <td width="200">&nbsp;</td>
                            </tr>
                        </tbody>
                    </table>
                </tbody>
                <div>&nbsp;</div>
                <div>&nbsp;</div>
            </table>
        </div>
    `
  );
};
const FormEmail = (name, email, randomCode, resetPasswordUrl) => {
  return (
    /*html*/
    `
          <div style="margin: 5px auto 5px; padding: 5px; max-width: 600px; background: linear-gradient(to left,#7347c1,#0674ec); border: 5px solid transparent; background-repeat: no-repeat; background-origin: padding-box,border-box">
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="background:white">
                  <tbody>
                      <table cellpadding="0" cellspacing="0" border="0" align="center" width="600">
                          <tbody>
                              <tr>
                                  <td width="100%" colspan="3" align="center" style="padding-bottom:10px;padding-top:25px">
                                      <div align="center">
                                          <h2>Khôi phục tài khoản</h2>
                                      </div>
                                  </td>
                              </tr>
                              <tr>
                                  <td width="100">&nbsp;</td>
                                  <td width="400" align="center">
                                      <div align="left">
                                          <p>
                                              Xin chào <b style="color:#0674ec">${name}</b>
                                              <div>&nbsp;</div>
                                              Email: <b style="color:#0674ec">${email}</b>
                                              <div>&nbsp;</div>
                                              Mã bảo mật: <b style="color:red">${randomCode}</b>
                                              <div>&nbsp;</div>
                                              Bấm vào nút <b style="color:#0674ec">Khôi Phục</b> bên dưới để đổi mật khẩu<br>
                                              <div>&nbsp;</div>
                                              <span style="color:red">Thư này chỉ tồn tại trong 3 phút</span>
                                          </p>
                                      </div>
                                  </td>
                                  <td width="100">&nbsp;</td>
                              </tr>
                          </tbody>
                      </table>
                      <table cellpadding="0" cellspacing="0" border="0" align="center" width="600">
                          <tbody>
                              <tr>
                                  <td width="200">&nbsp;</td>
                                  <td width="200" align="center" style="padding-top:25px">
                                      <table cellpadding="0" cellspacing="0" border="0" align="center" width="200" height="50">
                                          <tbody>
                                              <tr>
                                                  <td bgcolor="#0674ec" align="center" style="border-radius:4px" width="200" height="50">
                                                      <a href=${resetPasswordUrl} target="_blank" style="color: white; text-decoration: none">
                                                          <div align="center">
                                                              <p>Khôi phục</p>
                                                          </div>
                                                      </a>
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </td>
                                  <td width="200">&nbsp;</td>
                              </tr>
                          </tbody>
                      </table>
                  </tbody>
                  <div>&nbsp;</div>
                  <div>&nbsp;</div>
              </table>
          </div>
      `
  );
};
const FormRestPassword = (name, email, randomCode) => {
  return (
    /*html*/
    `
          <div style="margin: 5px auto 5px; padding: 5px; max-width: 600px; background: linear-gradient(to left,#7347c1,#0674ec); border: 5px solid transparent; background-repeat: no-repeat; background-origin: padding-box,border-box">
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="background:white">
                  <tbody>
                      <table cellpadding="0" cellspacing="0" border="0" align="center" width="600">
                          <tbody>
                              <tr>
                                  <td width="100%" colspan="3" align="center" style="padding-bottom:10px;padding-top:25px">
                                      <div align="center">
                                          <h2>Thay đổi mật khẩu</h2>
                                      </div>
                                  </td>
                              </tr>
                              <tr>
                                  <td width="100">&nbsp;</td>
                                  <td width="400" align="center">
                                      <div align="left">
                                          <p>
                                              Xin chào <b style="color:#0674ec">${name}</b>
                                              <div>&nbsp;</div>
                                              Email: <b style="color:#0674ec">${email}</b>
                                              <div>&nbsp;</div>
                                              Mã bảo mật: <b style="color:red">${randomCode}</b>
                                              <div>&nbsp;</div>
                                              <span style="color:red">Mã này chỉ tồn tại trong 3 phút</span>
                                          </p>
                                      </div>
                                  </td>
                                  <td width="100">&nbsp;</td>
                              </tr>
                          </tbody>
                      </table>
                      <table cellpadding="0" cellspacing="0" border="0" align="center" width="600">
                          <tbody>
                              <tr>
                                  <td width="200">&nbsp;</td>
                                  <td width="200" align="center" style="padding-top:25px">
                                      <table cellpadding="0" cellspacing="0" border="0" align="center" width="200" height="50">
                                          <tbody>
                                              <tr>
                                                  <td bgcolor="#0674ec" align="center" style="border-radius:4px" width="200" height="50">
                                                      <a href="#" target="_blank" style="color: white; text-decoration: none">
                                                          <div align="center">
                                                              <p>hãy nhập mã bên trên để đổi mật khẩu </p>
                                                          </div>
                                                      </a>
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </td>
                                  <td width="200">&nbsp;</td>
                              </tr>
                          </tbody>
                      </table>
                  </tbody>
                  <div>&nbsp;</div>
                  <div>&nbsp;</div>
              </table>
          </div>
      `
  );
};
dotenv.config();
const sendVerifyEmail = async (email, name, randomCode, verifyUrl) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    auth: {
      user: process.env.MAIL,
      pass: process.env.PASS
    }
  });
  await transporter.sendMail({
    from: "thanhnvph26404@gmail.com",
    to: email,
    subject: "Xác minh tài khoản",
    text: "Chào bạn, " + email,
    html: `${FormVerify(name, email, randomCode, verifyUrl)}`
  });
};
const sendMail = async (name, email, randomCode, resetPasswordUrl) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    auth: {
      user: process.env.MAIL,
      pass: process.env.PASS
    }
  });
  await transporter.sendMail({
    from: "thanhnvph26404@gmail.com",
    to: email,
    subject: "Quên mật khẩu",
    text: "Chào bạn, " + email,
    html: `${FormEmail(name, email, randomCode, resetPasswordUrl)}`
  });
};
const sendRestPassword = async (name, email, randomCode) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    auth: {
      user: process.env.MAIL,
      pass: process.env.PASS
    }
  });
  await transporter.sendMail({
    from: "thanhnvph26404@gmail.com",
    to: email,
    subject: "Thay đổi mật khẩu",
    text: "Chào bạn, " + email,
    html: `${FormRestPassword(name, email, randomCode)}`
  });
};
const sendContact = async ({ name, email, content }) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    auth: {
      user: process.env.MAIL,
      pass: process.env.PASS
    }
  });
  await transporter.sendMail({
    from: "bavuongnganhthuongcung4@gmail.com",
    to: email,
    subject: "Trả lời phản hồi",
    text: "Chào bạn, " + email,
    html: (
      /*html*/
      `<div>
    <h3>Chào ${name},</h3>
    
    <p>Chúng tôi xin gửi email này để gửi lời cảm ơn chân thành đến bạn vì đã phản hồi về [${content}]. Sự phản hồi của bạn có ý nghĩa quan trọng đối với chúng tôi và chúng tôi rất trân trọng điều đó.</p>
    <p>Chúng tôi luôn đánh giá cao sự góp ý, ý kiến và phản hồi của người dùng. Điều này giúp chúng tôi nâng cao chất lượng sản phẩm/dịch vụ của mình và mang đến trải nghiệm tốt hơn cho khách hàng. Phản hồi của bạn sẽ được chúng tôi chuyển tiếp cho nhóm liên quan để xem xét và đưa ra các biện pháp cải tiến.</p>
    <p>Nếu bạn có bất kỳ yêu cầu hoặc câu hỏi nào khác, xin vui lòng liên hệ với chúng tôi. Chúng tôi luôn sẵn lòng hỗ trợ bạn.</p>
    <p>Một lần nữa, chúng tôi xin chân thành cảm ơn sự phản hồi của bạn. Sự hỗ trợ và đóng góp của bạn là điều quan trọng để chúng tôi có thể tiếp tục cung cấp dịch vụ tốt nhất cho người dùng.</p>
    <br>
    <p>Trân trọng,</p>
  </div>`
    )
  });
};
const registerSchema = joi.object({
  name: joi.string().required().messages(errorMessages("Tên")),
  email: joi.string().email().required().messages(errorMessages("Email")),
  password: joi.string().required().min(6).messages(errorMessages("Mật khẩu")),
  confirmPassword: joi.string().valid(joi.ref("password")).required().messages(errorMessages("Xác nhận mật khẩu"))
});
const generateRandomCode = () => {
  let randomCode = "";
  for (let i = 0; i < 6; i++) {
    randomCode += Math.floor(Math.random() * 10);
  }
  return randomCode;
};
const loginSchema = joi.object({
  email: joi.string().email().required().messages(errorMessages("Tài khoản")),
  password: joi.string().min(6).required().messages(errorMessages("Mật khẩu"))
});
const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    // Tham chiếu đến model User hoặc bạn có thể đổi thành tên model người dùng tương ứng
    required: true
  },
  totalAfterDiscount: {
    type: Number
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        // Tham chiếu đến model Product hoặc bạn có thể đổi thành tên model sản phẩm tương ứng
        required: true
      },
      productVariant: {
        size: String,
        color: String
      },
      quantity: {
        type: Number,
        required: true
      },
      totalProduct: {
        type: Number
      },
      productInfo: {
        images: [],
        name: String,
        brand: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Brand"
          // Tham chiếu đến model Brand hoặc bạn có thể đổi thành tên model thương hiệu tương ứng
        },
        price: {
          type: Number,
          required: true
        },
        category: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category"
          // Tham chiếu đến model Category hoặc bạn có thể đổi thành tên model danh mục tương ứng
        }
      }
    }
  ],
  total: {
    type: Number,
    default: 0
  },
  usedCoupons: [{
    type: String
    // Mã giảm giá đã sử dụng sẽ được lưu ở đây
  }]
});
const Cart = mongoose.model("Cart", cartSchema);
const orderSchema$1 = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true
    },
    vouchers: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "voucher",
      required: false
      // Đặt required là false để cho phép giá trị null
    },
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        hasReviewed: {
          type: Boolean,
          default: false
          // Ban đầu, đánh dấu là chưa đánh giá
        },
        productVariant: {
          size: String,
          color: String
        },
        quantity: {
          type: Number,
          required: true
        },
        productInfo: {
          images: [],
          // Dựa vào mô hình sản phẩm, bạn có thể lưu các thông tin tương tự
          name: String,
          brand: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Brand"
            // Tham chiếu đến model Brand hoặc bạn có thể đổi thành tên model thương hiệu tương ứng
          },
          price: {
            type: Number,
            required: true
          },
          category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category"
            // Tham chiếu đến model Category hoặc bạn có thể đổi thành tên model danh mục tương ứng
          }
        }
      }
    ],
    statusHistory: [
      {
        status: {
          type: String,
          required: true
        },
        updatedAt: {
          type: Date,
          default: Date.now
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        }
      }
    ],
    total: {
      type: Number
    },
    shippingType: {
      type: String
    },
    paymentStatus: {
      type: String,
      default: "thanh toán khi nhận hàng",
      enum: ["thanh toán khi nhận hàng", "Paypal", "VNPAY"]
    },
    status: {
      type: String,
      default: "Đang xử lý",
      enum: [
        "đang chờ được xử lý",
        "hủy đơn hàng",
        "không thể hủy đơn hàng",
        "thanh toán thành công",
        "người bán đang chuẩn bị hàng",
        "Chờ thanh toán",
        "Đang xử lý",
        "Đang giao hàng",
        "Đã giao hàng",
        "shipper đã lấy hàng",
        "đơn hàng đang chuẩn bị được giao đến bạn",
        "Đã hủy",
        "Đã hoàn tiền",
        "Đã hoàn thành"
      ]
    },
    cancelReason: {
      type: String
      // Trường lý do hủy đơn hàng
    },
    cancelRequest: {
      type: Boolean,
      default: false
      // Mặc định là false, khi không có yêu cầu hủy
    },
    paymentIntent: {},
    phone: {
      type: String
    },
    Address: {
      type: String
    },
    country: {
      type: String
    }
    // notes: {
    //     type: String
    // },
    // paymentId: {
    //     type: String
    // },
    // paymentCode: {
    //     type: String
    // },
    // payerId: {
    //     type: String
    // }
  },
  { timestamps: true, versionKey: false }
);
const Order = mongoose.model("order", orderSchema$1);
const voucherSchema$1 = new mongoose.Schema({
  name: {
    type: String,
    require: true
  },
  code: {
    type: String,
    require: true
  },
  discount: {
    type: Number,
    require: true
  },
  limit: {
    type: Number,
    require: true
  },
  startDate: {
    type: Date,
    require: true
  },
  endDate: {
    type: Date,
    require: true
  },
  detailVoucher: {
    type: String,
    require: true
  },
  status: {
    type: String,
    enum: ["active", "expored"],
    default: "active"
  },
  minimumOrderAmount: {
    type: Number,
    required: true
  }
}, { versionKey: false, timeseries: true });
const Voucher = mongoose.model("voucher", voucherSchema$1);
joi.object({
  name: joi.string().required().messages(errorMessages("Tên")),
  email: joi.string().email().required().messages(errorMessages("email")),
  phone: joi.string().required().messages(errorMessages("số điện thoại")),
  address: joi.string().required().messages(errorMessages("thành phố")),
  Address: joi.string().required().messages(errorMessages("huyện")),
  country: joi.string().required().messages(errorMessages("làng,ngõ xóm")),
  role: joi.string().required().messages(errorMessages("quyền"))
});
config();
const register = async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err2) => err2.message);
      return res.status(400).json({
        message: errors
      });
    }
    const email = await User.findOne({ email: req.body.email });
    if (email) {
      return res.status(404).json({
        message: "Email đã tồn tại"
      });
    }
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const user = {
      name: req.body.name,
      email: req.body.email,
      password: passwordHash
    };
    const data = await User.create(user);
    data.password = void 0;
    if (!data) {
      return res.status(404).json({ message: "Đăng ký thất bại" });
    }
    let randomCode = generateRandomCode();
    let randomString = v4();
    const token = jwt.sign(
      {
        email: req.body.email,
        randomCode,
        randomString
      },
      process.env.SECRET_KEY
    );
    const verifyUrl = `${process.env.APP_URL}/auth/verify-email/${randomString}/${token}`;
    sendVerifyEmail(req.body.email, req.body.name, randomCode, verifyUrl);
    return res.status(200).json({
      message: "Đăng ký tài khoản thành công",
      data,
      token
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const verify = async (req, res) => {
  const { randomCode, randomString } = req.body;
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập"
      });
    }
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const email = decoded.email;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(500).json({
        message: "Không tìm thấy người dùng"
      });
    }
    if (user.isVerifyEmail) {
      return res.status(400).json({
        message: "Email đã được kích hoạt"
      });
    }
    if (randomCode !== decoded.randomCode || randomString !== decoded.randomString) {
      return res.status(500).json({
        message: "Mã xác minh không chính xác"
      });
    }
    user.isVerifyEmail = true;
    await user.save();
    return res.status(200).json({
      message: "Xác minh email thành công"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const getAllUser = async (req, res) => {
  try {
    const user = await User.find();
    res.json({
      user
    });
  } catch (error) {
    throw Error(error);
  }
};
const getOneUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user || user.length === 0) {
      return res.status(400).json({
        message: "không có danh sách người dùng "
      });
    }
    res.json({
      message: "Lấy người dùng thành công ",
      user
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Lỗi server " + error.message
    });
  }
};
const removeUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findByIdAndDelete(id);
    if (!user || user.length === 0) {
      return res.status(400).json({
        message: "không có danh sách người dùng cần xóa  "
      });
    }
    res.json({
      message: "xóa thành công "
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Lỗi server " + error.message
    });
  }
};
const updateUser = async (req, res) => {
  const { _id } = req.user;
  const { name, email, phone } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    const currentUser = await User.findById(_id);
    if (currentUser.email !== email) {
      if (existingUser && existingUser._id.toString() !== _id) {
        return res.status(400).json({ message: "Email đã tồn tại trong hệ thống." });
      }
      currentUser.email = email;
    }
    currentUser.name = name;
    currentUser.phone = phone;
    const updatedUser = await currentUser.save();
    res.status(200).json({
      message: "Cập nhật thành công",
      user: updatedUser
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Lỗi server " + error.message
    });
  }
};
const updateUserAdmin = async (req, res) => {
  const userId = req.params.id;
  const {
    name,
    email: newEmail,
    // Đổi tên biến email thành newEmail để không ghi đè lên biến email gốc
    Address,
    address,
    role,
    country,
    phone
  } = req.body;
  try {
    const existingUserWithEmail = await User.findOne({ email: newEmail });
    if (existingUserWithEmail && existingUserWithEmail._id.toString() !== userId) {
      return res.status(400).json({ message: "Email đã tồn tại trong hệ thống" });
    }
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          name,
          email: newEmail,
          // Sử dụng newEmail thay vì email ban đầu
          Address,
          address,
          role,
          country,
          phone
        }
      },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Đã xảy ra lỗi khi cập nhật thông tin người dùng" });
  }
};
const logIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { error } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        message: error.details.map((err2) => err2.message)
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "Tài khoản hoặc mật khẩu không đúng"
      });
    }
    if (user.isBlocked) {
      return res.status(403).json({
        message: "Tài khoản của bạn đã bị chặn. Liên hệ với quản trị viên để biết thêm chi tiết."
      });
    }
    const passwordHash = await bcrypt.compare(password, user.password);
    if (!passwordHash) {
      return res.status(404).json({
        message: "Tài khoản hoặc mật khẩu không đúng"
      });
    }
    const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1d"
    });
    user.password = void 0;
    return res.status(200).json({
      message: "Đăng nhập tài khoản thành công",
      token
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const getUserByToken = async (req, res) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập"
      });
    }
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        message: "Người dùng không tồn tại"
      });
    }
    res.status(200).json({
      message: "Cập nhật thành công",
      data: user
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        message: "Token đã hết hạn!"
      });
    } else if (error instanceof jwt.NotBeforeError) {
      return res.status(401).json({
        message: "Token chưa có hiệu lực!"
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        message: "Token không hợp lệ!"
      });
    }
    console.error(error);
    return res.status(500).json({
      message: "Đã có lỗi xảy ra!"
    });
  }
};
const BlockUser = async (req, res) => {
  const { id } = req.params;
  try {
    const block = await User.findByIdAndUpdate(id, {
      isBlocked: true
    }, { new: true });
    res.status(200).json({
      message: "block thành công ",
      block
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const unBlockUser = async (req, res) => {
  const { id } = req.params;
  try {
    const block = await User.findByIdAndUpdate(id, {
      isBlocked: false
    }, { new: true });
    res.status(200).json({
      message: "unblock thành công ",
      block
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const editAddressToken = async (req, res) => {
  var _a, _b, _c;
  const { _id } = req.user;
  try {
    const user = await User.findByIdAndUpdate(_id, {
      address: (_a = req == null ? void 0 : req.body) == null ? void 0 : _a.address,
      Address: (_b = req == null ? void 0 : req.body) == null ? void 0 : _b.Address,
      country: (_c = req == null ? void 0 : req.body) == null ? void 0 : _c.country
    }, {
      new: true
    });
    res.json(user);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, size, color, quantity } = req.body;
    const users = await User.findById(userId);
    const productInfo = await Product.findById(productId);
    const existingCart = await Cart.findOne({ userId });
    const priceToUse = productInfo.original_price !== void 0 && productInfo.original_price !== null ? productInfo.original_price : productInfo.price;
    const cartItem = {
      product: productId,
      productVariant: {
        size,
        color
      },
      quantity,
      productInfo: {
        images: productInfo.images,
        name: productInfo.name,
        brand: productInfo.brand,
        category: productInfo.category,
        price: priceToUse,
        address: users.address
      }
    };
    const variantExists = productInfo.ProductVariants.some(
      (variant) => variant.size === size && variant.color === color
    );
    if (variantExists) {
      if (existingCart) {
        const existingItemIndex = existingCart.items.findIndex(
          (item) => item.product.toString() === productId && item.productVariant.size === size && item.productVariant.color === color
        );
        if (existingItemIndex !== -1) {
          existingCart.items[existingItemIndex].quantity += quantity;
        } else {
          existingCart.items.push(cartItem);
        }
        const productToUpdate = await Product.findById(productId);
        const variantToUpdate = productToUpdate.ProductVariants.find(
          (variant) => variant.size === size && variant.color === color
        );
        if (variantToUpdate) {
          variantToUpdate.quantity -= quantity;
          if (variantToUpdate.quantity < 0) {
            return res.status(400).json({
              message: `Sản phẩm đã hết size hoặc màu bạn đã chọn (${size}, ${color}).`
            });
          }
          await productToUpdate.save();
        }
        await existingCart.save();
        let total = 0;
        for (const item of existingCart.items) {
          total += item.productInfo.price * item.quantity;
        }
        existingCart.total = total;
        await existingCart.save();
      } else {
        const newCart = new Cart({
          userId,
          items: [cartItem]
        });
        const productToUpdate = await Product.findById(productId);
        const variantToUpdate = productToUpdate.ProductVariants.find(
          (variant) => variant.size === size && variant.color === color
        );
        if (variantToUpdate) {
          variantToUpdate.quantity -= quantity;
          if (variantToUpdate.quantity < 0) {
            return res.status(400).json({
              message: `Sản phẩm đã hết size hoặc màu bạn đã chọn (${size}, ${color}).`
            });
          }
          await productToUpdate.save();
        }
        await newCart.save();
        let total = 0;
        for (const item of newCart.items) {
          total += item.productInfo.price * item.quantity;
        }
        newCart.total = total;
        await newCart.save();
      }
      return res.status(200).json({
        message: "Đã thêm sản phẩm vào giỏ hàng."
      });
    } else {
      return res.status(400).json({
        message: "Size hoặc màu không hợp lệ cho sản phẩm này."
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Lỗi máy chủ: " + error.message
    });
  }
};
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const productId = req.params.id;
    const existingCart = await Cart.findOne({ userId });
    if (!existingCart) {
      return res.status(404).json({
        message: "Giỏ hàng không tồn tại."
      });
    }
    const itemIndex = existingCart.items.findIndex(
      (item) => item.product.toString() === productId
    );
    if (itemIndex === -1) {
      return res.status(404).json({
        message: "Sản phẩm không tồn tại trong giỏ hàng."
      });
    }
    existingCart.items.splice(itemIndex, 1);
    let total = 0;
    for (const item of existingCart.items) {
      total += item.productInfo.price * item.quantity;
    }
    existingCart.total = total;
    await existingCart.save();
    return res.status(200).json({
      message: "Đã xóa sản phẩm khỏi giỏ hàng."
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Lỗi máy chủ: " + error.message
    });
  }
};
const getUserCart = async (req, res) => {
  const { _id } = req.user;
  try {
    const getUser = await Cart.findOne({ userId: _id }).populate("items.product").populate("userId");
    res.json(getUser);
  } catch (error) {
    throw new Error(error);
  }
};
const emptyCart = async (req, res) => {
  const { _id } = req.user;
  try {
    const user = await User.findOne({ _id });
    const cart = await Cart.findOneAndRemove({ userId: user._id });
    res.json(cart);
  } catch (error) {
    throw new Error(error);
  }
};
const updateOrderStatus = async (req, res, next) => {
  const { status } = req.body;
  const { id } = req.params;
  const { _id } = req.user;
  try {
    const existingOrder = await Order.findById(id);
    if (existingOrder.status === "Đã hoàn thành" || existingOrder.status === "Đã hủy" || existingOrder.status === "đang chờ được xử lý" || existingOrder.status === "Đã hoàn tiền") {
      return res.status(400).json({
        error: "Không thể thay đổi trạng thái của đơn hàng này"
      });
    }
    const isAllowedToChange = canChangeToNewStatus(existingOrder, status);
    if (!isAllowedToChange) {
      return res.status(400).json({
        error: "Không thể quay lại trạng thái này"
      });
    }
    existingOrder.statusHistory.push({
      status,
      updatedBy: _id,
      // ID của người thực hiện hành động
      updatedAt: /* @__PURE__ */ new Date()
    });
    existingOrder.status = status;
    const updatedOrder = await existingOrder.save();
    if (status === "Đã hủy" || status === "Đã hoàn tiền") {
      for (const item of updatedOrder.products) {
        const { product, quantity } = item;
        await Product.updateOne(
          { _id: product._id },
          { $inc: { quantity, sold: -quantity } }
        );
        const { productVariant: productVariant2 } = item;
        const { size, color } = productVariant2;
        await Product.findOneAndUpdate(
          {
            _id: product._id,
            "ProductVariants.size": size,
            "ProductVariants.color": color
          },
          { $inc: { "ProductVariants.$.quantity": quantity } }
        );
      }
    }
    res.json(updatedOrder);
  } catch (error) {
    return next(error);
  }
};
const canChangeToNewStatus = (existingOrder, newStatus) => {
  const statusHistory = existingOrder.statusHistory.map((item) => item.status);
  const initialStatus = statusHistory[0];
  if (newStatus === initialStatus) {
    return false;
  }
  const hasChangedToNewStatus = statusHistory.includes(newStatus);
  return !hasChangedToNewStatus;
};
const applyCoupon = async (req, res) => {
  const { _id } = req.user;
  const { voucher } = req.body;
  const user = await User.findOne({ _id }).populate("vouchers");
  const cart = await Cart.findOne({ userId: user._id }).populate("items.product");
  const userVoucher = user.vouchers.find((v) => v.code === voucher);
  console.log(cart.total);
  if (!userVoucher) {
    return res.status(400).json({
      error: "bạn chưa có mã giảm giá này"
    });
  }
  const validCoupon = await Voucher.findOne({ code: voucher });
  const currentDate = /* @__PURE__ */ new Date();
  if (currentDate <= new Date(validCoupon.endDate) && currentDate >= new Date(validCoupon.startDate) && cart.total >= userVoucher.minimumOrderAmount) {
    const availableVoucher = await Voucher.findOne({ code: voucher, limit: { $gt: 0 } });
    if (!availableVoucher) {
      return res.json({ error: "Mã giảm giá đã hết hoặc không hợp lệ." });
    }
    let totalAfterDiscount = (cart.total - cart.total * validCoupon.discount / 100).toFixed(2);
    await Cart.findOneAndUpdate(
      { userId: user._id },
      { totalAfterDiscount },
      { new: true }
    );
    res.json(totalAfterDiscount);
  } else {
    res.json({ error: "Mã giảm giá không hợp lệ hoặc đơn hàng không đạt yêu cầu." });
  }
};
const createOrder$1 = async (req, res) => {
  const { COD, address, VNPAY, couponApplied, TTONL, Address, shippingType, phone, discountCode, country } = req.body;
  const { _id } = req.user;
  try {
    let method = "COD";
    let paymentStatus = "thanh toán khi nhận hàng";
    if (TTONL) {
      method = "TTONL";
      paymentStatus = "Paypal";
    } else if (VNPAY) {
      method = "VNPAY";
      paymentStatus = "VNPAY";
    } else if (!COD) {
      throw new Error("Lỗi khi chọn phương thức thanh toán");
    }
    let shippingFee = 0;
    if (shippingType === "nhanh") {
      shippingFee = 3e4;
    } else if (shippingType === "hỏa tốc") {
      shippingFee = 5e4;
    }
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { $set: { address, phone, Address, country } },
      { new: true }
    );
    if (!updatedUser) {
      throw new Error("User not found");
    }
    const user = await User.findById(_id);
    let userCart = await Cart.findOne({ userId: updatedUser._id });
    let finalAmount = couponApplied && userCart.totalAfterDiscount ? userCart.totalAfterDiscount + shippingFee : userCart.total + shippingFee;
    let newOrder = await new Order({
      products: userCart.items,
      paymentIntent: {
        id: uniqid(),
        method,
        amount: finalAmount,
        status: "thanh toán thành công",
        created: Date.now(),
        currency: "VND"
      },
      userId: updatedUser._id,
      paymentStatus,
      address,
      Address,
      phone,
      shippingType,
      discountCode,
      country
    }).save();
    const newStatus = {
      status: "Đang xử lý",
      updatedBy: _id,
      updatedAt: Date.now()
      // Ngày giờ cập nhật
    };
    if (couponApplied) {
      const usedVoucher = await Voucher.findOneAndUpdate(
        { code: discountCode },
        // Sử dụng mã giảm giá từ đơn hàng để xác định voucher đã sử dụng
        { $inc: { limit: -1 } },
        { new: true }
      );
      console.log(usedVoucher);
      if (!usedVoucher) {
        throw new Error("Không tìm thấy mã giảm giá đã sử dụng");
      }
    }
    await Order.findByIdAndUpdate(
      newOrder._id,
      {
        $push: { statusHistory: newStatus }
      },
      { new: true }
    );
    await Cart.findOneAndDelete({ userId: user._id });
    let update2 = userCart.items.map((item) => {
      return {
        updateOne: {
          filter: { _id: item.product._id },
          update: { $inc: { sold: +item.quantity } }
        }
      };
    });
    const updated = await Product.bulkWrite(update2, {});
    return res.json({ message: "success", newOrder });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
function sortObject$1(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}
const createPaymentUrl = async (req, res) => {
  const { amount, address, Address, shippingType, phone, discountCode, couponApplied, country } = req.body;
  const { _id } = req.user;
  try {
    let date = /* @__PURE__ */ new Date();
    let createDate = moment(date).format("YYYYMMDDHHmmss");
    let ipAddr = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    let tmnCode = process.env.VNP_TMN_CODE;
    let secretKey = process.env.VNP_HASH_SECRET;
    let vnpUrl = process.env.VNP_URL;
    let returnUrl = process.env.VNP_RETURN_URL;
    let currCode = "VND";
    let orderId = moment(date).format("DDHHmmss");
    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    vnp_Params["vnp_Locale"] = "vn";
    vnp_Params["vnp_CurrCode"] = currCode;
    vnp_Params["vnp_TxnRef"] = orderId;
    vnp_Params["vnp_OrderInfo"] = "Thanh toan cho ma GD:" + orderId;
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = amount * 100;
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    vnp_Params["vnp_IpAddr"] = ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;
    vnp_Params = sortObject$1(vnp_Params);
    let signData = qs$1.stringify(vnp_Params, { encode: false });
    let hmac = crypto$1.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;
    vnpUrl += "?" + qs$1.stringify(vnp_Params, { encode: false });
    let shippingFee = 0;
    if (shippingType === "nhanh") {
      shippingFee = 3e4;
    } else if (shippingType === "hỏa tốc") {
      shippingFee = 5e4;
    }
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { $set: { address, phone, Address, country } },
      { new: true }
    );
    if (!updatedUser) {
      throw new Error("User not found");
    }
    const user = await User.findById(_id);
    let userCart = await Cart.findOne({ userId: updatedUser._id });
    let finalAmount = couponApplied && userCart.totalAfterDiscount ? userCart.totalAfterDiscount + shippingFee : userCart.total + shippingFee;
    let newOrder = await new Order({
      products: userCart.items,
      paymentIntent: {
        id: uniqid(),
        method: "VNPAY",
        amount: finalAmount,
        status: "thanh toán thành công",
        created: Date.now(),
        currency: "VND"
      },
      userId: updatedUser._id,
      paymentStatus: "VNPAY",
      address,
      Address,
      phone,
      shippingType,
      discountCode,
      country
    }).save();
    const newStatus = {
      status: "Đang xử lý",
      updatedBy: _id,
      updatedAt: Date.now()
      // Ngày giờ cập nhật
    };
    if (couponApplied) {
      const usedVoucher = await Voucher.findOneAndUpdate(
        { code: discountCode },
        // Sử dụng mã giảm giá từ đơn hàng để xác định voucher đã sử dụng
        { $inc: { limit: -1 } },
        { new: true }
      );
      console.log(usedVoucher);
      if (!usedVoucher) {
        throw new Error("Không tìm thấy mã giảm giá đã sử dụng");
      }
    }
    await Order.findByIdAndUpdate(
      newOrder._id,
      {
        $push: { statusHistory: newStatus }
      },
      { new: true }
    );
    await Cart.findOneAndDelete({ userId: user._id });
    let update2 = userCart.items.map((item) => {
      return {
        updateOne: {
          filter: { _id: item.product._id },
          update: { $inc: { sold: +item.quantity } }
        }
      };
    });
    const updated = await Product.bulkWrite(update2, {});
    return res.status(200).json({
      message: "Truy cập đường dẫn",
      url: vnpUrl
    });
  } catch (error) {
    console.error(error);
  }
};
const vnpayReturn = async (req, res) => {
  try {
    let vnp_Params = req.query;
    let secureHash = vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];
    vnp_Params = sortObject$1(vnp_Params);
    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    let signData = qs$1.stringify(vnp_Params, { encode: false });
    let hmac = crypto$1.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
    console.log(signData);
    if (secureHash === signed) {
      return res.redirect("http://localhost:5173/ordersuccess");
    } else {
      return res.status(400).json({ error: "Chữ ký không hợp lệ" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};
const getOrders = async (req, res) => {
  const { _id } = req.user;
  try {
    const Order$1 = await Order.find({ userId: _id }).populate("products").populate("statusHistory.updatedBy").sort({ createdAt: -1 }).exec();
    res.json({
      Order: Order$1
    });
  } catch (error) {
    throw new Error(error);
  }
};
const getAllOrders$1 = async (req, res) => {
  try {
    const Order$1 = await Order.find().populate("products.product").populate("statusHistory.updatedBy").populate("userId").sort({ createdAt: -1 }).exec();
    res.json({ Order: Order$1 });
  } catch (error) {
    throw new Error(error);
  }
};
const getoneOrders = async (req, res) => {
  const id = req.params.id;
  try {
    const Order$1 = await Order.findById(id).populate({
      path: "products.productInfo.category",
      // Đường dẫn đến category trong productInfo
      model: "Category"
      // Tên của model Category
    }).populate("products.product").populate("statusHistory.updatedBy").populate("userId").exec();
    res.json(
      Order$1
    );
  } catch (error) {
    throw new Error(error);
  }
};
const cancelOrderRequest = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const { _id } = req.user;
  try {
    const user = await User.findById(_id);
    const Order$1 = await Order.findById(id);
    if (Order$1.cancelReason) {
      return res.status(400).json({ error: "Đơn hàng đã được gửi yêu cầu trước đó" });
    }
    const updatedStatusHistory = Order$1.statusHistory || [];
    updatedStatusHistory.push({
      status: "đang chờ được xử lý",
      // hoặc trạng thái mới mà bạn muốn thêm vào
      updatedAt: /* @__PURE__ */ new Date(),
      updatedBy: user._id
      // hoặc thông tin người cập nhật
    });
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status: "đang chờ được xử lý", cancelReason: reason, cancelRequest: true, statusHistory: updatedStatusHistory },
      // Cập nhật cancelReason
      { new: true }
    );
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "thanhnvph26404@gmail.com",
        // Email của bạn
        pass: "ricjggvzlskbtsxl"
        // Mật khẩu email của bạn
      }
    });
    const mailOptions = {
      from: "yourEmail@gmail.com",
      to: "honggiang22112003@gmail.com",
      // Địa chỉ email muốn gửi thông báo đến
      subject: "Yêu cầu hủy đơn hàng",
      text: `Đơn hàng ${id} yêu cầu hủy với lý do: ${reason} bạn hãy check tài khoản của mình`
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error occurred while sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });
    res.json(updatedOrder);
  } catch (error) {
    return res.status(500).json({ error: "Lỗi server: " + error.message });
  }
};
const confirmCancelOrder = async (req, res) => {
  const { id } = req.params;
  const { isConfirmed } = req.body;
  req.user;
  req.user;
  try {
    const orderToCancel = await Order.findById(id);
    if (!orderToCancel) {
      return res.status(404).json({ error: "Đơn hàng không tồn tại." });
    }
    const userId = orderToCancel.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy thông tin người dùng" });
    }
    const userEmail = user.email;
    if (isConfirmed) {
      const updatedStatusHistory = orderToCancel.statusHistory || [];
      updatedStatusHistory.push({
        status: "Đã hủy",
        // hoặc trạng thái mới mà bạn muốn thêm vào
        updatedAt: /* @__PURE__ */ new Date(),
        updatedBy: user._id
        // hoặc thông tin người cập nhật
      });
      await Order.findByIdAndUpdate(
        id,
        { status: "Đã hủy", cancelReason: orderToCancel.cancelReason, statusHistory: updatedStatusHistory },
        { new: true }
      );
      for (const item of orderToCancel.products) {
        const { product, quantity, productVariant: productVariant2 } = item;
        await Product.updateOne(
          { _id: product._id },
          { $inc: { quantity, sold: -quantity } }
        );
        const { size, color } = productVariant2;
        await Product.findOneAndUpdate(
          {
            _id: product._id,
            "ProductVariants.size": size,
            "ProductVariants.color": color
          },
          { $inc: { "ProductVariants.$.quantity": quantity } }
        );
      }
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "thanhnvph26404@gmail.com",
          // Email của bạn
          pass: "ricjggvzlskbtsxl"
          // Mật khẩu email của bạn
        }
      });
      const mailOptions = {
        from: "yourEmail@gmail.com",
        to: userEmail,
        // Email người dùng đăng nhập
        subject: "Xác nhận hủy đơn hàng",
        text: `Đơn hàng ${id} đã được hủy.`
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Error occurred while sending email:", error);
        } else {
          console.log("Email sent:", info.response);
        }
      });
      res.json({ message: "Đơn hàng đã được hủy." });
    } else {
      const updatedStatusHistory = orderToCancel.statusHistory || [];
      updatedStatusHistory.push({
        status: "Đang giao hàng",
        // hoặc trạng thái mới mà bạn muốn thêm vào
        updatedAt: /* @__PURE__ */ new Date(),
        updatedBy: user._id
        // hoặc thông tin người cập nhật
      });
      await Order.findByIdAndUpdate(
        id,
        { status: "Đang giao hàng", cancelReason: orderToCancel.cancelReason, cancelRequest: false, statusHistory: updatedStatusHistory },
        { new: true }
      );
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "thanhnvph26404@gmail.com",
          // Email của bạn
          pass: "ricjggvzlskbtsxl"
          // Mật khẩu email của bạn
        }
      });
      const mailOptions = {
        from: "yourEmail@gmail.com",
        to: userEmail,
        // Email người dùng đăng nhập
        subject: "Từ chối hủy đơn hàng",
        text: `Yêu cầu hủy đơn hàng ${id} không được chấp nhận.`
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Error occurred while sending email:", error);
        } else {
          console.log("Email sent:", info.response);
        }
      });
      res.json({ message: "Đơn hàng không thể hủy." });
    }
  } catch (error) {
    return res.status(500).json({ error: "Lỗi server: " + error.message });
  }
};
const getCancelledOrders = async (req, res) => {
  try {
    const cancelledOrders = await Order.find({ cancelRequest: true });
    res.json(cancelledOrders);
  } catch (error) {
    return res.status(500).json({ error: "Lỗi server: " + error.message });
  }
};
const getCancelledtrueOrders = async (req, res) => {
  const { status, startDates, endDates } = req.body;
  try {
    let query = {};
    if (status && startDates && endDates) {
      query.createdAt = { $gte: new Date(startDates), $lte: new Date(endDates) };
      query.status = status;
    } else if (startDates && endDates) {
      query.createdAt = { $gte: new Date(startDates), $lte: new Date(endDates) };
    } else if (status) {
      query.status = status;
    } else {
      return res.status(400).json({ error: "Vui lòng cung cấp ít nhất một trường thông tin." });
    }
    const orders = await Order.find(query).populate("userId");
    const totalOrders = orders.length;
    res.json({ orders, totalOrders });
  } catch (error) {
    return res.status(500).json({ error: "Lỗi server: " + error.message });
  }
};
const findOrderByid = async (req, res) => {
  const { orderId } = req.body;
  try {
    if (!orderId) {
      return res.status(400).json({ error: "Vui lòng cung cấp ID đơn hàng." });
    }
    const foundOrder = await Order.findOne({ "paymentIntent.id": orderId }).populate("userId");
    if (!foundOrder) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng với ID này trong paymentIntent." });
    }
    res.json(foundOrder);
  } catch (error) {
    return res.status(500).json({ error: "Lỗi server: " + error.message });
  }
};
const findOrderByPhone = async (req, res) => {
  const { phone } = req.body;
  try {
    if (!phone) {
      return res.status(400).json({ error: "Vui lòng cung cấp số điện thoại đơn hàng." });
    }
    const foundOrder = await Order.find({ phone }).populate("userId");
    if (!foundOrder) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng với ID này trong paymentIntent." });
    }
    res.json(foundOrder);
  } catch (error) {
    return res.status(500).json({ error: "Lỗi server: " + error.message });
  }
};
const increaseQuantity = async (req, res) => {
  const { _id } = req.user;
  const { id } = req.params;
  const { increaseBy } = req.body;
  try {
    const existingCart = await Cart.findOne({ userId: _id });
    if (!existingCart) {
      return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
    }
    const itemToIncrease = existingCart.items.find((item) => item._id.toString() === id);
    if (!itemToIncrease) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại trong giỏ hàng" });
    }
    const { size, color } = itemToIncrease.productVariant;
    const productVariant2 = await Product.findOne({ "ProductVariants.size": size, "ProductVariants.color": color });
    if (!productVariant2) {
      return res.status(404).json({ message: "Không tìm thấy thông tin biến thể sản phẩm" });
    }
    const specificVariant = productVariant2.ProductVariants.find(
      (variant) => variant.size === size && variant.color === color
    );
    if (!specificVariant) {
      return res.status(404).json({ message: "Không tìm thấy biến thể sản phẩm" });
    }
    if (specificVariant.quantity < itemToIncrease.quantity + increaseBy) {
      return res.status(400).json({ message: "Quá số lượng màu và size" });
    }
    const previousQuantity = itemToIncrease.quantity;
    itemToIncrease.quantity += increaseBy;
    await existingCart.save();
    const total = existingCart.items.reduce((acc, item) => {
      return acc + item.productInfo.price * item.quantity;
    }, 0);
    existingCart.total = total;
    await existingCart.save();
    return res.status(200).json({ message: "Số lượng sản phẩm đã được tăng" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi máy chủ: " + error.message });
  }
};
const decreaseQuantity = async (req, res) => {
  const { _id } = req.user;
  const { id } = req.params;
  const { decreaseBy } = req.body;
  try {
    const existingCart = await Cart.findOne({ userId: _id });
    if (!existingCart) {
      return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
    }
    const itemToDecrease = existingCart.items.find((item) => item._id.toString() === id);
    if (!itemToDecrease) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại trong giỏ hàng" });
    }
    const previousQuantity = itemToDecrease.quantity;
    itemToDecrease.quantity -= decreaseBy;
    await existingCart.save();
    const total = existingCart.items.reduce((acc, item) => {
      return acc + item.productInfo.price * item.quantity;
    }, 0);
    existingCart.total = total;
    await existingCart.save();
    return res.status(200).json({ message: "Số lượng sản phẩm đã được giảm" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi máy chủ: " + error.message });
  }
};
const getWishList = async (req, res) => {
  const { _id } = req.user;
  try {
    const getWish = await User.findById(_id).populate("wishList");
    res.json(getWish);
  } catch (error) {
    throw new Error(error);
  }
};
const removeWishList = async (req, res) => {
  const { _id } = req.user;
  const productId = req.params.id;
  try {
    const User$1 = await User.findOne({ _id });
    if (!User$1) {
      return res.status(404).json({
        message: "người dùng không tồn tại."
      });
    }
    const WishList = User$1.wishList.findIndex((item) => item._id.toString() === productId);
    if (WishList === -1) {
      return res.status(404).json({
        message: "Sản phẩm không tồn tại trong sản phẩm yêu thích ."
      });
    }
    User$1.wishList.splice(WishList, 1);
    await User$1.save();
    return res.status(200).json({
      message: "Đã xóa sản phẩm khỏi danh sách."
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Lỗi máy chủ: " + error.message
    });
  }
};
const cancleOrder = async (req, res) => {
  const { id } = req.params;
  const { cancelReason } = req.body;
  const { _id } = req.user;
  try {
    const orders = await Order.findById(id);
    if (!orders) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    const userId = orders.userId;
    console.log(userId);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy thông tin người dùng" });
    }
    const userEmail = user.email;
    if (orders.status == "Đã hoàn thành" || orders.status == "Đã hủy") {
      return res.status(400).json({ message: "Không thể thay đổi trạng thái đơn hàng này " });
    }
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "thanhnvph26404@gmail.com",
        // Email của bạn
        pass: "ricjggvzlskbtsxl"
        // Mật khẩu email của bạn
      }
    });
    const mailOptions = {
      from: "your_email@example.com",
      // Địa chỉ email của bạn
      to: userEmail,
      // Sử dụng thông tin email từ đơn hàng
      subject: "Thông báo: Đơn hàng đã được hủy",
      text: "Đơn hàng của bạn đã được hủy thành công. Chi tiết lý do: " + cancelReason
    };
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.error("Lỗi khi gửi email:", error);
      } else {
        console.log("Email thông báo đã được gửi: " + info.response);
      }
    });
    orders.cancelReason = cancelReason;
    orders.status = "Đã hủy";
    console.log(cancelReason);
    orders.statusHistory.push({
      status: "Đã hủy",
      updatedAt: Date.now(),
      updatedBy: _id
      // ID của người thực hiện hành động hủy đơn hàng
    });
    await orders.save();
    return res.status(200).json({ message: "Đã cập nhật trạng thái hủy đơn hàng" });
  } catch (error) {
    console.error("Lỗi khi cập nhật đơn hàng:", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi khi cập nhật đơn hàng" });
  }
};
const getvoucher = async (req, res) => {
  const { _id } = req.user;
  try {
    const getVoucher = await User.findById(_id).populate("vouchers");
    res.json(getVoucher);
  } catch (error) {
    return res.status(500).json({ message: "Đã xảy ra lỗi khi cập nhậtvoucher" });
  }
};
const voucherSchema = joi.object({
  name: joi.string().required().messages(errorMessages("Tên")),
  code: joi.string().required().messages(errorMessages("Mã")),
  discount: joi.number().required().messages(errorMessages("Giảm giá")),
  limit: joi.number().min(0).required().messages(errorMessages("Giới hạn")),
  minimumOrderAmount: joi.number().min(0).required().messages(errorMessages("Giới hạn tiền")),
  detailVoucher: joi.string().required().messages(errorMessages("chi tiết voucher")),
  startDate: joi.string().required().messages(errorMessages("Ngày bắt đầu")),
  endDate: joi.string().required().messages(errorMessages("Ngày kết thúc"))
});
const creatVoucher = async (req, res) => {
  try {
    const { error } = voucherSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err2) => err2.message);
      return res.status(400).json({
        message: errors
      });
    }
    const checkVoucher2 = await Voucher.findOne({ code: req.body.code });
    if (checkVoucher2) {
      return res.status(404).json({
        message: "mã code đã tồn tại "
      });
    }
    const vouchers = await Voucher.create(req.body);
    if (!vouchers) {
      return res.status(404).json({
        message: "thêm voucher thất bại "
      });
    }
    res.status(200).json({
      vouchers,
      message: "thêm voucher thành công "
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const updateVoucher = async (req, res) => {
  try {
    const { error } = voucherSchema.validate(req.body, { abortEarly: true });
    if (error) {
      const errors = error.details.map((err2) => err2.message);
      return res.status(400).json({
        errors
      });
    }
    const vouchers = await Voucher.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vouchers) {
      return res.status(404).json({
        message: "update không thành công "
      });
    }
    res.status(200).json({
      vouchers,
      message: "update thành công "
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const checkVoucher = async (req, res) => {
  try {
    const data = await Voucher.findOne({ code: req.body.code });
    if (!data) {
      return res.status(404).json({
        message: "Voucher không tồn tại"
      });
    }
    const user = await User.findOne({ vouchers: data._id });
    if (user) {
      return res.status(400).json({
        message: "Bạn đã sử dụng voucher này"
      });
    }
    if (data.limit === 0) {
      return res.status(404).json({
        message: "Voucher đã hết lượt sử dụng"
      });
    }
    return res.status(200).json({
      message: "Thông tin voucher",
      data
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const getAll$5 = async (req, res) => {
  try {
    const vouchers = await Voucher.find();
    if (!vouchers || vouchers.length === 0) {
      return res.status(404).json({
        message: "Không có danh sách"
      });
    }
    res.status(200).json({
      message: "Danh sách voucher",
      data: vouchers
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const getOne$5 = async (req, res) => {
  try {
    const data = await Voucher.findById(req.params.id);
    if (!data) {
      return res.status(404).json({
        message: "Không có thông tin"
      });
    }
    return res.status(200).json({
      message: "Thông tin voucher",
      data
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const remove$5 = async (req, res) => {
  try {
    const data = await Voucher.findByIdAndDelete(req.params.id);
    if (!data) {
      return res.status(404).json({
        message: "Xóa voucher thất bại"
      });
    }
    return res.status(200).json({
      message: "Xóa voucher thành công "
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const saveVoucherToUser = async (req, res) => {
  const { _id } = req.user;
  const { voucherId } = req.body;
  console.log(voucherId);
  try {
    const user = await User.findById(_id);
    console.log(user);
    const alreadyExists = user.vouchers.find((id) => id.toString() === voucherId);
    console.log(alreadyExists);
    if (alreadyExists) {
      return res.status(400).json({ message: "bạn đã lưu voucher" });
    } else {
      let updateVoucher2 = await User.findByIdAndUpdate(
        _id,
        {
          $push: { vouchers: voucherId }
        },
        { new: true }
      );
      res.json(
        updateVoucher2
      );
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật đơn hàng:", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi khi cập nhật đơn hàng" });
  }
};
const router$e = express.Router();
router$e.post("/register", register);
router$e.post("/login", logIn);
router$e.post("/add-to-cart", authMiddlware, addToCart);
router$e.post("/verify", verify);
router$e.put("/block-user/:id", authMiddlware, isAdmin, BlockUser);
router$e.put("/unblock-user/:id", authMiddlware, isAdmin, unBlockUser);
router$e.put("/saveaddress", authMiddlware, editAddressToken);
router$e.get("/getAllUser", getAllUser);
router$e.get("/getOneUser/:id", authMiddlware, isAdmin, getOneUser);
router$e.delete("/removeUser/:id", removeUser);
router$e.post("/get-user-token", authMiddlware, getUserByToken);
router$e.put("/updateUser", authMiddlware, updateUser);
router$e.put("/updateUserAdmin/:id", authMiddlware, updateUserAdmin);
router$e.delete("/emptyCart", authMiddlware, emptyCart);
router$e.put("/update-order/:id", authMiddlware, updateOrderStatus);
router$e.post("/creatOrder", authMiddlware, createOrder$1);
router$e.get("/getOrder", authMiddlware, getOrders);
router$e.get("/getoneOrder/:id", authMiddlware, getoneOrders);
router$e.get("/getcancletrueOrder", authMiddlware, getCancelledOrders);
router$e.post("/getStatusOrder", authMiddlware, getCancelledtrueOrders);
router$e.post("/getIdOrder", authMiddlware, findOrderByid);
router$e.post("/getphoneOrder", authMiddlware, findOrderByPhone);
router$e.delete("/removeWishList/:id", authMiddlware, removeWishList);
router$e.get("/getAllOrder", authMiddlware, getAllOrders$1);
router$e.get("/getCart", authMiddlware, getUserCart);
router$e.delete("/removeOneCart/:id", authMiddlware, removeFromCart);
router$e.post("/cancel-order/:id", authMiddlware, cancelOrderRequest);
router$e.put("/confirm-cancel-order/:id", authMiddlware, confirmCancelOrder);
router$e.post("/applycoupon", authMiddlware, applyCoupon);
router$e.put("/increaseQuantity/:id", authMiddlware, increaseQuantity);
router$e.get("/getWishlist", authMiddlware, getWishList);
router$e.put("/wishList", authMiddlware, addTowishList);
router$e.put("/decreaseQuantity/:id", authMiddlware, decreaseQuantity);
router$e.put("/cancelOrder/:id", authMiddlware, cancleOrder);
router$e.post("/create_payment_url", authMiddlware, createPaymentUrl);
router$e.get("/vnpay_return", vnpayReturn);
router$e.put("/saveVoucher", authMiddlware, saveVoucherToUser);
router$e.get("/getvouchers", authMiddlware, getvoucher);
router$e.get("/product", locproduct);
dotenv.config();
const loginMiddleware = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập"
      });
    }
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        message: "Người dùng không tồn tại"
      });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        message: "Token đã hết hạn!"
      });
    } else if (error instanceof jwt.NotBeforeError) {
      return res.status(401).json({
        message: "Token chưa có hiệu lực!"
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        message: "Token không hợp lệ!"
      });
    }
    console.error(error);
    return res.status(500).json({
      message: "Đã có lỗi xảy ra!"
    });
  }
};
const router$d = express.Router();
router$d.get("/", getAll$5);
router$d.get("/:id", getOne$5);
router$d.post("/createVoucher", creatVoucher), router$d.put("/:id", updateVoucher);
router$d.post("/check-voucher", loginMiddleware, checkVoucher);
router$d.delete("/:id", remove$5);
const getSecurityCode = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      message: "Email không tồn tại"
    });
  }
  let randomCode = generateRandomCode();
  let randomString = v4();
  const token = jwt.sign(
    { email, randomCode, randomString },
    process.env.SECRET_KEY,
    { expiresIn: "3m" }
  );
  const resetPasswordUrl = `${process.env.APP_URL}/password/reset-password/${randomString}`;
  sendMail(user.name, user.email, randomCode, resetPasswordUrl);
  return res.status(200).json({
    message: "Gửi mã thành công",
    accessCode: token
  });
};
const resetPassword = async (req, res) => {
  const { password, randomString, randomCode } = req.body;
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    console.log(decoded);
    const user = await User.findOne({ email: decoded.email });
    console.log(user);
    if (!user) {
      return res.status(404).json({
        message: "User không tồn tại"
      });
    }
    if (randomString !== decoded.randomString || randomCode !== decoded.randomCode) {
      return res.status(400).json({
        message: "Mã bảo mật không chính xác!"
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu phải có độ dài từ 6 ký tự trở lên"
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      return res.status(400).json({
        message: "Không được giống mật khẩu cũ"
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userNew = await User.findOneAndUpdate(
      { email: decoded.email },
      { password: hashedPassword },
      { new: true }
    );
    return res.status(200).json({
      message: "Đặt lại mật khẩu thành công"
    });
  } catch (err2) {
    console.error(err2);
    if (err2.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token đã hết hạn!"
      });
    }
    return res.status(500).json({
      message: "Đã có lỗi xảy ra khi đổi mật khẩu"
    });
  }
};
const getCode = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      message: "Email không tồn tại"
    });
  }
  let randomCode = generateRandomCode();
  sendRestPassword(user.name, user.email, randomCode);
  const code = jwt.sign(
    { email: user.email, code: randomCode },
    process.env.SECRET_KEY,
    {
      expiresIn: "3m"
    }
  );
  return res.status(200).json({
    message: "Gửi mã thành công",
    code
  });
};
const checkCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!req.headers.authorization) {
      return res.status(400).json({
        message: "Kiểm tra thất bại"
      });
    }
    const codeCheck = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(codeCheck, process.env.SECRET_KEY);
    if (code !== decoded.code) {
      return res.status(400).json({
        message: "Mã bảo mật không chính xác!"
      });
    }
    return res.status(200).json({
      message: "Mã bảo mật chính xác"
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token đã hết hạn!"
      });
    }
    return res.status(500).json({
      message: "Đã có lỗi xảy ra"
    });
  }
};
const changePassword = async (req, res) => {
  const { oldPassword, password, confirmPassword } = req.body;
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({
        message: "User không tồn tại"
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Hai mật khẩu không khớp!"
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu phải có độ dài từ 6 ký tự trở lên"
      });
    }
    const checkPass = await bcrypt.compare(oldPassword, user.password);
    if (!checkPass) {
      return res.status(400).json({
        message: "Mật khẩu cũ không chính xác"
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      return res.status(400).json({
        message: "Không được giống mật khẩu cũ"
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userNew = await User.findOneAndUpdate(
      { email: decoded.email },
      { password: hashedPassword },
      { new: true }
    );
    return res.status(200).json({
      message: "Đổi mật khẩu thành công"
    });
  } catch (err2) {
    console.error(err2);
    if (err2.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token đã hết hạn!"
      });
    }
    return res.status(500).json({
      message: "Đã có lỗi xảy ra khi đổi mật khẩu"
    });
  }
};
const router$c = express.Router();
router$c.post("/forgot-password", getSecurityCode);
router$c.post("/reset-password", resetPassword);
router$c.post("/send-code", authMiddlware, getCode);
router$c.post("/check-code", checkCode);
router$c.post("/change-pass", changePassword);
v2.config({
  cloud_name: "ecommer",
  api_key: "378865246822613",
  api_secret: "4uRxyZprCSIqNe9JQ18lDu6-CyU"
});
const uploadImage = async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(404).json({ error: "No files were uploaded" });
  }
  try {
    const result = await v2.uploader.upload(file.path);
    return res.json({
      urls: {
        uid: result.public_id,
        url: result.secure_url
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const uploadImages = async (req, res) => {
  const files = req.files;
  console.log("files", files);
  if (!Array.isArray(files)) {
    return res.status(400).json({ error: "No files were uploaded" });
  }
  try {
    const uploadPromises = files.map((file) => {
      return v2.uploader.upload(file.path);
    });
    console.log("uploadPromises", uploadPromises);
    const results = await Promise.all(uploadPromises);
    console.log(results);
    const uploadedFiles = results.map((result) => ({
      url: result.secure_url,
      uid: result.public_id
    }));
    return res.json({ urls: uploadedFiles });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const updateImage = async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(404).json({ error: "No files were uploaded" });
  }
  const publicId = req.params.publicId;
  const newImage = file.path;
  try {
    const [uploadResult, deleteResult] = await Promise.all([
      v2.uploader.upload(newImage),
      v2.uploader.destroy(publicId)
    ]);
    return res.json({
      urls: {
        url: uploadResult.secure_url,
        uid: uploadResult.public_id
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message || "Error updating image" });
  }
};
const categorySchema = joi.object({
  _id: joi.string(),
  title: joi.string().required().messages(errorMessages("Danh mục")),
  image: joi.object({
    uid: joi.string().required().messages(errorMessages("Uid")),
    url: joi.string().required().messages(errorMessages("Đường dẫn"))
  })
});
const getAll$4 = async (req, res) => {
  try {
    const data = await Category.find();
    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "Không có danh sách"
      });
    }
    console.log(data);
    return res.status(200).json({
      data
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const getOne$4 = async (req, res) => {
  try {
    const result = await Category.findById(req.params.id);
    if (!result || result.length === 0) {
      return res.status(404).json({
        message: "Không có thông tin"
      });
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const create$4 = async (req, res) => {
  try {
    const { error } = categorySchema.validate(req.body, {
      abortEarly: false
    });
    if (error) {
      const errors = error.details.map((err2) => err2.message);
      return res.status(400).json({
        message: errors
      });
    }
    const data = await Category.create(req.body);
    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "Không thêm được danh mục"
      });
    }
    return res.status(200).json({
      message: "Thêm danh mục thành công ",
      data
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const remove$4 = async (req, res) => {
  try {
    const data = await Category.findByIdAndDelete(req.params.id);
    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "Xóa danh mục thất bại"
      });
    }
    return res.status(200).json({
      message: "Xóa danh mục thành công "
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const update$4 = async (req, res) => {
  try {
    const { error } = categorySchema.validate(req.body, {
      abortEarly: false
    });
    if (error) {
      const errors = error.details.map((err2) => err2.message);
      return res.status(400).json({
        message: errors
      });
    }
    const data = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });
    if (!data) {
      return res.status(404).json({
        message: "Cập nhật danh mục thất bại"
      });
    }
    return res.status(200).json({
      message: "Cập nhật danh mục thành công ",
      data
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const getCategoryProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const products = await Product.find({ category: id });
    if (!products || products.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm trong danh mục này." });
    }
    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({ message: "Đã có lỗi xảy ra khi lấy sản phẩm từ danh mục." });
  }
};
const router$b = express.Router();
router$b.get("/", getAll$4);
router$b.get("/:id", getOne$4);
router$b.post("/", create$4);
router$b.patch("/:id", update$4);
router$b.delete("/:id", remove$4);
router$b.get("/getproduct/:id", getCategoryProduct);
const router$a = express.Router();
const storage = new CloudinaryStorage({
  cloudinary: v2,
  params: {
    folder: "ecommer"
  }
});
const upload = multer({ storage });
router$a.post("/upload", upload.single("images"), uploadImage);
router$a.post("/uploads", upload.array("images", 5), uploadImages);
router$a.put("/upload/:publicId", upload.single("images"), updateImage);
const contactSchema$1 = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: false
    },
    content: {
      type: String,
      required: true
    }
  },
  { timestamps: true, versionKey: false }
);
const Contact = mongoose.model("Contact", contactSchema$1);
const contactSchema = joi.object({
  name: joi.string().required().messages(errorMessages("tên ")),
  email: joi.string().email().required().messages(errorMessages("email ")),
  phone: joi.string().required().messages(errorMessages("phone ")),
  address: joi.string().optional(),
  content: joi.string().required().messages(errorMessages("content "))
});
const creatContact = async (req, res) => {
  try {
    const { error } = contactSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err2) => err2.message);
      return res.status(400).json({
        message: errors
      });
    }
    const contact = await Contact.create(req.body);
    sendContact(req.body);
    return res.status(200).json({
      message: "phản hồi thành công ",
      contact
    });
  } catch (error) {
    console.error(err);
    return res.status(500).json({
      message: "Đã có lỗi xảy ra"
    });
  }
};
const router$9 = express.Router();
router$9.post("/creatContact", creatContact);
const brandSchema = joi.object({
  title: joi.string().required().messages(errorMessages("tên thương hiệu  "))
});
const creatBrand = async (req, res) => {
  try {
    const { error } = brandSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err2) => err2.message);
      return res.status(400).json({
        message: errors
      });
    }
    const brand = await Brand.create(req.body);
    if (!brand) {
      return res.status(400).json({
        message: "lỗi không thêm được thương hiệu "
      });
    }
    return res.status(200).json({
      message: "thêm thương hiệu thành công ",
      brand
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const getAllBrand = async (req, res) => {
  try {
    const brand = await Brand.find();
    if (!brand) {
      return res.status(400).json({
        message: "lỗi lấy thương hiệu "
      });
    }
    return res.status(200).json({
      message: "lấy thành công ",
      brand
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const getOneBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(400).json({
        message: "lỗi lấy thương hiệu "
      });
    }
    return res.status(200).json({
      message: "lấy thành công ",
      brand
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findByIdAndUpdate(id, req.body, { new: true });
    if (!brand) {
      return res.status(400).json({
        message: "lỗi lấy thương hiệu "
      });
    }
    return res.status(200).json({
      message: "update thành công ",
      brand
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findByIdAndDelete(id);
    if (!brand) {
      return res.status(400).json({
        message: "lỗi lấy thương hiệu "
      });
    }
    return res.status(200).json({
      message: "xóa  thành công ",
      brand
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const router$8 = express.Router();
router$8.get("/", getAllBrand);
router$8.get("/:id", authMiddlware, isAdmin, getOneBrand);
router$8.post("/", creatBrand);
router$8.put("/:id", authMiddlware, isAdmin, updateBrand);
router$8.delete("/:id", authMiddlware, isAdmin, deleteBrand);
const Colorschema$1 = new mongoose.Schema({
  color: {
    type: String,
    required: true
  }
});
const Color = mongoose.model("Color", Colorschema$1);
const Colorschema = joi.object({
  color: joi.string().required().messages(errorMessages("color"))
});
const create$3 = async (req, res) => {
  try {
    const { error } = Colorschema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err2) => err2.message);
      return res.status(400).json({
        message: errors
      });
    }
    const data = await Color.create(req.body);
    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "Không thêm được thuộc tính"
      });
    }
    return res.status(200).json({
      message: "Thêm thuộc tính thành công ",
      data
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const getAll$3 = async (req, res) => {
  try {
    const data = await Color.find();
    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "Không có danh sách"
      });
    }
    return res.status(200).json({
      data
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const getOne$3 = async (req, res) => {
  try {
    const result = await Color.findById(req.params.id);
    if (!result || result.length === 0) {
      return res.status(404).json({
        message: "Không có thông tin"
      });
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const remove$3 = async (req, res) => {
  try {
    const data = await Color.findByIdAndDelete(req.params.id);
    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "Xóa thuộc tính thất bại"
      });
    }
    return res.status(200).json({
      message: "Xóa thuộc tính thành công "
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const update$3 = async (req, res) => {
  try {
    const { error } = Colorschema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err2) => err2.message);
      return res.status(400).json({
        message: errors
      });
    }
    const data = await Color.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });
    if (!data) {
      return res.status(404).json({
        message: "Cập nhật thuộc tính thất bại"
      });
    }
    return res.status(200).json({
      message: "Cập nhật thuộc tính thành công ",
      data
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const router$7 = express.Router();
router$7.get("/", getAll$3);
router$7.get("/:id", getOne$3);
router$7.post("/", create$3);
router$7.put("/:id", update$3);
router$7.delete("/:id", remove$3);
const valueAttributeSchema$1 = joi.object({
  attribute: joi.string().required().messages(errorMessages("Thuộc tính")),
  value: joi.string().required().messages(errorMessages("Giá trị thuộc tính"))
});
const valueAttributeSchema = new mongoose.Schema({
  attribute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Attribute",
    required: true
  },
  value: {
    type: String,
    required: true
  }
});
const valueAttribute = mongoose.model("ValueAttribute", valueAttributeSchema);
const create$2 = async (req, res) => {
  try {
    const { error } = valueAttributeSchema$1.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err2) => err2.message);
      return res.status(400).json({
        message: errors
      });
    }
    const data = await valueAttribute.create(req.body);
    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "Không thêm được giá trị thuộc tính"
      });
    }
    return res.status(200).json({
      message: "Thêm giá trị thuộc tính thành công ",
      data
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const getAll$2 = async (req, res) => {
  try {
    const data = await valueAttribute.find().populate("attribute");
    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "Không có danh sách"
      });
    }
    return res.status(200).json({
      data
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const getOne$2 = async (req, res) => {
  try {
    const result = await valueAttribute.findById(req.params.id);
    if (!result || result.length === 0) {
      return res.status(404).json({
        message: "Không có thông tin"
      });
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const getbyidatribute = async (req, res) => {
  try {
    const data = await valueAttribute.find().populate("attribute");
    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "Không có danh sách"
      });
    }
    const newdata = data.filter((item) => item.attribute._id == req.params.id);
    return res.status(200).json({
      data: newdata
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const remove$2 = async (req, res) => {
  try {
    const data = await valueAttribute.findByIdAndDelete(req.params.id);
    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "Xóa giá trị thuộc tính thất bại"
      });
    }
    return res.status(200).json({
      message: "Xóa giá trị thuộc tính thành công "
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const update$2 = async (req, res) => {
  try {
    const { error } = valueAttributeSchema$1.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err2) => err2.message);
      return res.status(400).json({
        message: errors
      });
    }
    const data = await valueAttribute.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });
    if (!data) {
      return res.status(404).json({
        message: "Cập nhật giá trị thuộc tính thất bại"
      });
    }
    return res.status(200).json({
      message: "Cập nhật giá trị thuộc tính thành công ",
      data
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const router$6 = express.Router();
router$6.get("/:id", getOne$2);
router$6.get("/", getAll$2);
router$6.get("/byidatribute/:id", getbyidatribute);
router$6.post("/", create$2);
router$6.patch("/:id", update$2);
router$6.delete("/:id", remove$2);
const productVariantSchema$1 = joi.object({
  AttributeValues: joi.array().required().messages(errorMessages("giá trị Thuộc tính")),
  inventory: joi.number().required().messages(errorMessages("số lượng"))
});
const productVariantSchema = new mongoose.Schema({
  Attribute: [
    {
      attribute: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Attribute",
        required: true
      },
      value: {
        type: String,
        required: true
      }
    }
  ],
  inventory: {
    type: Number,
    min: 0,
    required: true
  }
});
const productVariant = mongoose.model("ProductVariant", productVariantSchema);
const create$1 = async (req, res) => {
  try {
    const { error } = productVariantSchema$1.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err2) => err2.message);
      return res.status(400).json({
        message: errors
      });
    }
    const data = await productVariant.create(req.body);
    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "Không thêm được biến thể sản phẩm"
      });
    }
    return res.status(200).json({
      message: "Thêm biến thể sản phẩm ",
      data
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const getAll$1 = async (req, res) => {
  try {
    const data = await productVariant.find().populate({ path: "AttributeValues", populate: "attribute" });
    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "Không có danh sách"
      });
    }
    return res.status(200).json({
      data
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const getOne$1 = async (req, res) => {
  try {
    const result = await productVariant.findById(req.params.id).populate({ path: "AttributeValues", populate: "attribute" });
    if (!result || result.length === 0) {
      return res.status(404).json({
        message: "Không có thông tin"
      });
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const remove$1 = async (req, res) => {
  try {
    const data = await productVariant.findByIdAndDelete(req.params.id);
    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "Xóa biến thể sản phẩm thất bại"
      });
    }
    return res.status(200).json({
      message: "Xóa biến thể sản phẩm thành công "
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const update$1 = async (req, res) => {
  try {
    const { error } = productVariantSchema$1.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err2) => err2.message);
      return res.status(400).json({
        message: errors
      });
    }
    const data = await productVariant.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });
    if (!data) {
      return res.status(404).json({
        message: "Cập nhật biến thể sản phẩm thất bại"
      });
    }
    return res.status(200).json({
      message: "Cập nhật biến thể sản phẩm thành công ",
      data
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const router$5 = express.Router();
router$5.get("/", getAll$1);
router$5.get("/:id", getOne$1);
router$5.post("/", create$1);
router$5.patch("/:id", update$1);
router$5.delete("/:id", remove$1);
const orderSchema = joi.object({
  // fullname: Joi.string().required().messages( errorMessages( "tên " ) ),
  // phoneNumber: Joi.string().required().messages( errorMessages( "số điện thoại " ) ),
  // city: Joi.string().required().messages( errorMessages( "thành phố " ) ),
  // district: Joi.string().required().messages( errorMessages( "quận/huyện " ) ),
  // commune: Joi.string().optional(),
  // detailAddress: Joi.string().required().messages( errorMessages( "địa chỉ chi tiết " ) ),
  orderStatus: joi.string().valid(
    "thanh toán khi nhận hàng",
    "Đang chờ duyệt",
    "Đã nhận đơn",
    "Đang giao hàng",
    "Đã hoàn thành"
  ).default("Đang chờ duyệt").required(),
  totalAfterDiscount: joi.number().required().messages(errorMessages("giá sau khi giảm")),
  // user: Joi.string().required(), // Sử dụng kiểu dữ liệu phù hợp cho ID của người dùng
  productOrder: joi.array().items(
    joi.object({
      product: joi.object({
        name: joi.string().required(),
        price: joi.number().min(0).required(),
        original_price: joi.number().min(0).required(),
        description: joi.string().required(),
        images: joi.array().items(
          joi.object({
            status: joi.string().default("done"),
            name: joi.string().required(),
            uid: joi.string().required(),
            url: joi.string().required()
          })
        ).required(),
        category: joi.string().required(),
        // Sử dụng kiểu dữ liệu phù hợp cho ID của danh mục
        comments: joi.array().items(joi.string())
        // Sử dụng kiểu dữ liệu phù hợp cho ID của bình luận
      }),
      quantity: joi.number()
    })
  )
}).messages(errorMessages("order "));
const createOrder = async (req, res) => {
  try {
    const { error } = orderSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err2) => err2.message);
      return res.status(400).json({
        message: errors
      });
    }
    const newOrder = new Order(req.body);
    const createdOrder = await newOrder.save();
    res.status(201).json({
      order: createdOrder,
      message: "Tạo đơn hàng thành công"
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};
const updateOrder = async (req, res) => {
  try {
    const { error } = orderSchema.validate(req.body, { abortEarly: true });
    if (error) {
      const errors = error.details.map((err2) => err2.message);
      return res.status(400).json({
        errors
      });
    }
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedOrder) {
      return res.status(404).json({ message: "Cập nhật đơn hàng không thành công" });
    }
    res.status(200).json({
      order: updatedOrder,
      message: "Cập nhật đơn hàng thành công"
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};
const deleteOrder = async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndRemove(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ message: "Xóa đơn hàng không thành công" });
    }
    res.status(200).json({ message: "Xóa đơn hàng thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json({
      orders,
      message: "Danh sách đơn hàng"
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};
const getOneOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    res.status(200).json({
      order,
      message: "Thông tin đơn hàng"
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};
const calculateTotalAmount = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $nin: ["Đã hủy", "Đã hoàn tiền"] }
    });
    let totalAmount = 0;
    orders.forEach((order) => {
      totalAmount += order.paymentIntent.amount;
    });
    res.json({
      totalAmount
    });
  } catch (error) {
    console.error("Lỗi khi tính tổng số tiền:", error);
    return 0;
  }
};
const calculatetotalAmountday = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const datesInRange = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      datesInRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    const result = await Order.aggregate([
      {
        $match: {
          status: { $nin: ["Đã hủy", "Đã hoàn tiền"] },
          createdAt: {
            $gte: new Date(startDate),
            $lt: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalAmount: { $sum: "$paymentIntent.amount" }
        }
      },
      {
        $sort: { _id: 1 }
        // Sắp xếp theo ngày tăng dần
      }
    ]);
    const logData = {};
    result.forEach((item) => {
      logData[item._id] = item.totalAmount;
    });
    console.log("Tất cả các ngày trong khoảng thời gian:");
    console.log(datesInRange);
    console.log("Tổng tiền từng ngày trong khoảng thời gian:");
    console.log(logData);
    datesInRange.forEach((date) => {
      const dateString = date.toISOString().split("T")[0];
      if (!logData.hasOwnProperty(dateString)) {
        logData[dateString] = 0;
      }
    });
    const dailyTotals = datesInRange.map((date) => {
      const dateString = date.toISOString().split("T")[0];
      return {
        _id: dateString,
        totalAmount: logData[dateString]
      };
    });
    console.log("Tổng tiền từng ngày trong khoảng thời gian sau khi kiểm tra:");
    console.log(logData);
    const totalAmountInRange = Object.values(logData).reduce((total, amount) => total + amount, 0);
    console.log("Tổng tổng tiền trong khoảng thời gian:", totalAmountInRange);
    res.json({ dailyTotals, logData, totalAmountInRange });
  } catch (error) {
    console.error("Lỗi khi lấy tổng tiền từng ngày trong khoảng thời gian:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi khi lấy tổng tiền từng ngày trong khoảng thời gian" });
  }
};
const calculatetotalAmountmonth = async (req, res) => {
  try {
    const { startYear, endYear } = req.body;
    const startMonth = startYear.substring(5);
    const endMonth = endYear.substring(5);
    const startDate = /* @__PURE__ */ new Date(`${startYear}-01T00:00:00.000Z`);
    const endDate = /* @__PURE__ */ new Date(`${endYear}-31T23:59:59.999Z`);
    const result = await Order.aggregate([
      {
        $match: {
          status: { $nin: ["Đã hủy", "Đã hoàn tiền"] },
          "createdAt": {
            $gte: startDate,
            $lt: endDate
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          totalAmount: { $sum: "$paymentIntent.amount" }
        }
      }
    ]);
    const finalData = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const formattedMonth = currentDate.toISOString().slice(0, 7);
      const foundMonth = result.find((item) => item._id === formattedMonth);
      if (currentDate >= startDate && currentDate <= endDate) {
        if (foundMonth) {
          finalData.push({ month: formattedMonth, totalAmount: foundMonth.totalAmount });
        } else {
          finalData.push({ month: formattedMonth, totalAmount: 0 });
        }
      }
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    const totalAmountAllMonths = finalData.reduce((total, monthData) => total + monthData.totalAmount, 0);
    console.log("Tổng tổng tiền trong khoảng thời gian:", totalAmountAllMonths);
    res.json({ result: finalData, totalAmountAllMonths });
  } catch (error) {
    console.error("Lỗi khi lấy tổng tiền theo khoảng thời gian:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi khi lấy tổng tiền theo khoảng thời gian" });
  }
};
const calculatetotalAmountyear = async (req, res) => {
  try {
    const { year } = req.body;
    const monthlyTotal = [];
    for (let month = 1; month <= 12; month++) {
      let endMonth = month + 1;
      let endYear = year;
      if (month === 12) {
        endMonth = 1;
        endYear++;
      }
      const result = await Order.aggregate([
        {
          $match: {
            status: { $nin: ["Đã hủy", "Đã hoàn tiền"] },
            "createdAt": {
              $gte: /* @__PURE__ */ new Date(`${year}-${month}-01T00:00:00.000Z`),
              $lt: /* @__PURE__ */ new Date(`${endYear}-${endMonth}-01T00:00:00.000Z`)
            }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$paymentIntent.amount" }
          }
        }
      ]);
      console.log(result);
      monthlyTotal.push({ month, totalAmount: result.length > 0 ? result[0].totalAmount : 0 });
    }
    res.json({ year, monthlyTotal });
  } catch (error) {
    console.error("Lỗi khi lấy tổng tiền từng tháng:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi khi lấy tổng tiền từng tháng" });
  }
};
const calculateTotalProductsSold = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const orders = await Order.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: { $nin: ["Đã hủy", "Đã hoàn tiền"] }
    });
    const productsSoldPerDay = {};
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split("T")[0];
      if (!productsSoldPerDay[date]) {
        productsSoldPerDay[date] = 0;
      }
      order.products.forEach((product) => {
        productsSoldPerDay[date] += product.quantity;
      });
    });
    const formattedData = Object.keys(productsSoldPerDay).map((date) => ({
      aday: date,
      totalproductslod: productsSoldPerDay[date]
    }));
    console.log("Số lượng sản phẩm bán được theo từng ngày:", formattedData);
    res.json({ productsSoldPerDay: formattedData });
  } catch (error) {
    console.error("Đã xảy ra lỗi khi tính toán số lượng sản phẩm:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi khi tính toán số lượng sản phẩm" });
  }
};
const calculateProductsSoldPerMonth = async (req, res) => {
  try {
    const { startYear, endYear } = req.body;
    const startMonth = startYear.substring(5);
    const endMonth = endYear.substring(5);
    const startDate = /* @__PURE__ */ new Date(`${startYear}-01T00:00:00.000Z`);
    const endDate = /* @__PURE__ */ new Date(`${endYear}-31T23:59:59.999Z`);
    const orders = await Order.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      },
      status: { $nin: ["Đã hủy", "Đã hoàn tiền"] }
    });
    const monthlyProductsSold = {};
    orders.forEach((order) => {
      const orderMonth = order.createdAt.toISOString().substring(0, 7);
      order.products.forEach((product) => {
        if (!monthlyProductsSold[orderMonth]) {
          monthlyProductsSold[orderMonth] = 0;
        }
        monthlyProductsSold[orderMonth] += product.quantity;
      });
    });
    const formattedMonthlyProducts = Object.keys(monthlyProductsSold).map((month) => ({
      month,
      totalProduct: monthlyProductsSold[month]
    }));
    console.log("Số sản phẩm bán được từng tháng:");
    console.log(formattedMonthlyProducts);
    res.json({ monthlyProductsSold: formattedMonthlyProducts });
  } catch (error) {
    console.error("Lỗi khi tính tổng số sản phẩm bán:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi khi tính tổng số sản phẩm bán" });
  }
};
const router$4 = express.Router();
router$4.post("/create", authMiddlware, createOrder);
router$4.get("/list", getAllOrders);
router$4.get("/get/:id", getOneOrder);
router$4.put("/update/:id", updateOrder);
router$4.delete("/delete/:id", deleteOrder);
router$4.get("/totalOrder", calculateTotalAmount);
router$4.post("/totalOrderaday", calculatetotalAmountday);
router$4.post("/totalOrderamonth", calculatetotalAmountmonth);
router$4.post("/totalOrderyear", calculatetotalAmountyear);
router$4.post("/productsSold", calculateTotalProductsSold);
router$4.post("/productsmonthSold", calculateProductsSoldPerMonth);
const sizeSchema$1 = joi.object({
  size: joi.string().required().messages(errorMessages("size"))
});
const sizeSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true
  }
});
const Size = mongoose.model("size", sizeSchema);
const create = async (req, res) => {
  try {
    const { error } = sizeSchema$1.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err2) => err2.message);
      return res.status(400).json({
        message: errors
      });
    }
    const data = await Size.create(req.body);
    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "Không thêm được thuộc tính"
      });
    }
    return res.status(200).json({
      message: "Thêm thuộc tính thành công ",
      data
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const getAll = async (req, res) => {
  try {
    const data = await Size.find();
    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "Không có danh sách"
      });
    }
    return res.status(200).json({
      data
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const getOne = async (req, res) => {
  try {
    const result = await Size.findById(req.params.id);
    if (!result || result.length === 0) {
      return res.status(404).json({
        message: "Không có thông tin"
      });
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const remove = async (req, res) => {
  try {
    const data = await Size.findByIdAndDelete(req.params.id);
    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "Xóa thuộc tính thất bại"
      });
    }
    return res.status(200).json({
      message: "Xóa thuộc tính thành công "
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const update = async (req, res) => {
  try {
    const { error } = sizeSchema$1.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err2) => err2.message);
      return res.status(400).json({
        message: errors
      });
    }
    const data = await Size.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });
    if (!data) {
      return res.status(404).json({
        message: "Cập nhật kích cỡ thất bại"
      });
    }
    return res.status(200).json({
      message: "Cập nhật kích cỡ thành công ",
      data
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const router$3 = express.Router();
router$3.get("/", getAll);
router$3.get("/:id", getOne);
router$3.post("/", create);
router$3.put("/:id", update);
router$3.delete("/:id", remove);
const commentSchema$1 = new mongoose.Schema(
  {
    product: {
      type: mongoose.Types.ObjectId,
      ref: "Product"
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User"
    },
    comment: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      default: 0
    },
    feedback: {
      type: Number,
      required: true
    }
  },
  { timestamps: true, versionKey: false }
);
const comment = mongoose.model("Comment", commentSchema$1);
const commentSchema = joi.object({
  product: joi.string().required().messages(errorMessages("sản phẩm")),
  name: joi.string().required().messages(errorMessages("tên")),
  email: joi.string().email().messages(errorMessages("tài khoản")),
  comment: joi.string().required().messages(errorMessages("bình luận")),
  feedback: joi.number().required().messages(errorMessages("đánh giá"))
});
const creatComment = async (req, res) => {
  try {
    const { error } = commentSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err2) => err2.message);
      console.log(errors);
      return res.status(401).json({
        data: errors
      });
    }
    const Comment = await comment.create({ ...req.body });
    if (!comment) {
      return res.status(400).json({
        message: "lỗi không thêm được bình luận "
      });
    }
    return res.status(200).json({
      message: "thêm bình luận thành công ",
      Comment
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const getAllComment = async (req, res) => {
  try {
    const Comment = await comment.find();
    if (!comment) {
      return res.status(400).json({
        message: "lỗi lấy bình luận "
      });
    }
    return res.status(200).json({
      message: "lấy thành công ",
      Comment
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const getCommentbyidproduct = async (req, res) => {
  const { id } = req.params;
  try {
    const Comment = await comment.find({ product: id });
    if (!comment) {
      return res.status(400).json({
        message: "lỗi lấy bình luận "
      });
    }
    return res.status(200).json({
      message: "lấy thành công ",
      Comment
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const getOneComment = async (req, res) => {
  try {
    const { id } = req.params;
    const Comment = await comment.findById(id);
    if (!comment) {
      return res.status(400).json({
        message: "lỗi lấy thương hiệu "
      });
    }
    return res.status(200).json({
      message: "lấy thành công ",
      Comment
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const Comment = await comment.findByIdAndUpdate(id, req.body, { new: true });
    if (!comment) {
      return res.status(400).json({
        message: "lỗi lấy bình luận "
      });
    }
    return res.status(200).json({
      message: "update thành công ",
      Comment
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const Comment = await comment.findByIdAndDelete(id);
    if (!comment) {
      return res.status(400).json({
        message: "lỗi lấy bình luận "
      });
    }
    return res.status(200).json({
      message: "xóa  thành công ",
      Comment
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const router$2 = express.Router();
router$2.get("/", getAllComment);
router$2.get("/byidproduct/:id", getCommentbyidproduct);
router$2.get("/:id", getOneComment);
router$2.post("/", creatComment);
router$2.put("/:id", updateComment);
router$2.delete("/:id", deleteComment);
const findProductsDiscounted = async (req, res) => {
  try {
    const productsWithOriginalPrice = await Product.find({ original_price: { $exists: true, $ne: null } });
    productsWithOriginalPrice.forEach(async (product) => {
      if (!isNaN(product.price) && !isNaN(product.original_price)) {
        const discountAmount = product.price - product.original_price;
        product.discountProduct = discountAmount;
        await product.save();
      }
    });
    return res.status(200).json({
      message: "Danh sách sản phẩm có giảm giá đã được tính toán và cập nhật",
      productsWithDiscount: productsWithOriginalPrice
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const findProductsSoldOverTwenty = async (req, res) => {
  try {
    const productsSoldOverTwenty = await Product.find({ sold: { $gt: 20 } });
    res.status(200).json({
      message: "Danh sách sản phẩm có sold > 20",
      productsSoldOverTwenty
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server: " + error.message
    });
  }
};
const productSold = async (req, res) => {
  try {
    const mostSoldProducts = await Product.find().sort({ sold: -1 }).limit(10);
    res.status(200).json({ mostSoldProducts });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch most sold products" });
  }
};
const productsbysalesrange = async (req, res) => {
  const { lowerBound, upperBound } = req.body;
  try {
    const productsInSalesRange = await Product.find({
      sold: { $gte: lowerBound, $lte: upperBound }
    });
    res.status(200).json({ productsInSalesRange });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch most sold products" });
  }
};
const router$1 = express.Router();
router$1.get("/", findProductsDiscounted);
router$1.get("/sold", findProductsSoldOverTwenty);
router$1.get("/productsold", productSold);
router$1.get("/products-by-sales-range", productsbysalesrange);
const router = express.Router();
config();
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}
router.post("/create_payment_url", function(req, res, next) {
  let ipAddr = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
  let tmnCode = process.env.VNP_TMN_CODE;
  let secretKey = process.env.VNP_HASH_SECRET;
  let vnpUrl = process.env.VNP_URL;
  let returnUrl = process.env.VNP_RETURN_URL;
  let date = /* @__PURE__ */ new Date();
  let createDate = dateformat(date, "yyyymmddHHmmss");
  let orderId = dateformat(date, "HHmmss");
  let amount = req.body.amount;
  var locale = req.body.language;
  if (locale === null || locale === "") {
    locale = "vn";
  }
  var currCode = "VND";
  var vnp_Params = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = tmnCode;
  vnp_Params["vnp_Locale"] = locale;
  vnp_Params["vnp_CurrCode"] = currCode;
  vnp_Params["vnp_TxnRef"] = orderId;
  vnp_Params["vnp_OrderInfo"] = "gd đơn hàng " + orderId;
  vnp_Params["vnp_OrderType"] = "other";
  vnp_Params["vnp_Amount"] = amount * 100;
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_IpAddr"] = ipAddr;
  vnp_Params["vnp_CreateDate"] = createDate;
  vnp_Params = sortObject(vnp_Params);
  var signData = qs.stringify(vnp_Params, { encode: false });
  var hmac = crypto.createHmac("sha512", secretKey);
  var signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;
  vnpUrl += "?" + qs.stringify(vnp_Params, { encode: false });
  res.redirect(vnpUrl);
});
router.get("/vnpay_ipn", function(req, res, next) {
  var vnp_Params = req.query;
  var secureHash = vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];
  vnp_Params = sortObject(vnp_Params);
  const secretKey = process.env.VNP_HASH_SECRET;
  var signData = qs.stringify(vnp_Params, { encode: false });
  var crypto2 = require("crypto");
  var hmac = crypto2.createHmac("sha512", secretKey);
  var signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
  if (secureHash === signed) {
    vnp_Params["vnp_TxnRef"];
    vnp_Params["vnp_ResponseCode"];
    res.status(200).json({ RspCode: "00", Message: "success" });
  } else {
    res.status(200).json({ RspCode: "97", Message: "Fail checksum" });
  }
});
router.get("/vnpay_return", function(req, res, next) {
  var vnp_Params = req.query;
  var secureHash = vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];
  vnp_Params = sortObject(vnp_Params);
  process.env.VNP_TMN_CODE;
  const secretKey = process.env.VNP_HASH_SECRET;
  var signData = qs.stringify(vnp_Params, { encode: false });
  var hmac = crypto.createHmac("sha512", secretKey);
  var signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
  if (secureHash === signed) {
    res.render("success", { code: vnp_Params["vnp_ResponseCode"] });
  } else {
    res.render("success", { code: "97" });
  }
});
const app = express();
dotenv.config();
connectDB(process.env.MONGO_URI);
app.use(express.json());
app.use(morgan("tiny"));
app.use(cors());
app.use("/auth", router$e);
app.use("/password", router$c);
app.use("/category", router$b);
app.use("/images", router$a);
app.use("/voucher", router$d);
app.use("/products", router$f);
app.use("/contact", router$9);
app.use("/brand", router$8);
app.use("/attribute", router$7);
app.use("/valueattribute", router$6);
app.use("/productvariant", router$5);
app.use("/order", router$4);
app.use("/color", router$7);
app.use("/size", router$3);
app.use("/comment", router$2);
app.use("/productDiscount", router$1);
app.use("/payment", router);
const viteNodeApp = app;
export {
  viteNodeApp
};
