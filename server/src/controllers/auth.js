import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "dotenv";
import { v4 as uuidv4 } from "uuid";
import Auth from '../models/auth';
import { sendVerifyEmail } from "../middleware/sendEmail";
import { registerSchema } from "../schemas/register";
import { generateRandomCode } from "../components/function";
import { loginSchema } from "../schemas/login";
import Product from "../models/products";
import Cart from "../models/cart";
import order from "../models/order";
import Voucher from "../models/voucher";
import uniqid from "uniqid"
import nodemailer from "nodemailer"
import moment from 'moment';
import qs from 'qs';
import crypto from 'crypto';
import { authSchema } from "../schemas/auth";

config();
// đăng kí
export const register = async ( req, res ) =>
{
  try
  {
    const { error } = registerSchema.validate( req.body, { abortEarly: false } );
    if ( error )
    {
      const errors = error.details.map( ( err ) => err.message );
      return res.status( 400 ).json( {
        message: errors,
      } );
    }

    const email = await Auth.findOne( { email: req.body.email } );
    if ( email )
    {
      return res.status( 404 ).json( {
        message: "Email đã tồn tại",
      } );
    }

    const passwordHash = await bcrypt.hash( req.body.password, 12 );
    const user = {
      name: req.body.name,
      email: req.body.email,
      password: passwordHash,
    };

    const data = await Auth.create( user );
    data.password = undefined;

    if ( !data )
    {
      return res.status( 404 ).json( { message: "Đăng ký thất bại" } );
    }

    let randomCode = generateRandomCode();
    let randomString = uuidv4();

    const token = jwt.sign(
      {
        email: req.body.email,
        randomCode: randomCode,
        randomString: randomString,
      },
     " final_secret_key"
    );

    const verifyUrl = `${ process.env.APP_URL }/auth/verify-email/${ randomString }/${ token }`;

    sendVerifyEmail( req.body.email, req.body.name, randomCode, verifyUrl );

    return res.status( 200 ).json( {
      message: "Đăng ký tài khoản thành công",
      data: data,
      token: token,
    } );
  } catch ( error )
  {
    console.log( error );

    return res.status( 500 ).json( {
      message: "Lỗi server: " + error.message,
    } );
  }
};

export const verify = async ( req, res ) =>
{
  const { randomCode, randomString } = req.body;

  try
  {
    if ( !req.headers.authorization )
    {
      return res.status( 401 ).json( {
        message: "Bạn chưa đăng nhập",
      } );
    }

    const token = req.headers.authorization.split( " " )[ 1 ];
    const decoded = jwt.verify( token,"  final_secret_key" );

    const email = decoded.email;

    const user = await Auth.findOne( { email } );
    if ( !user )
    {
      return res.status( 500 ).json( {
        message: "Không tìm thấy người dùng",
      } );
    }

    if ( user.isVerifyEmail )
    {
      return res.status( 400 ).json( {
        message: "Email đã được kích hoạt",
      } );
    }

    if (
      randomCode !== decoded.randomCode ||
      randomString !== decoded.randomString
    )
    {
      return res.status( 500 ).json( {
        message: "Mã xác minh không chính xác",
      } );
    }

    user.isVerifyEmail = true;
    await user.save();

    return res.status( 200 ).json( {
      message: "Xác minh email thành công",
    } );
  } catch ( error )
  {
    return res.status( 500 ).json( {
      message: "Lỗi server: " + error.message,
    } );
  }
};
// getsuser
export const getAllUser = async ( req, res ) =>
{
  try
  {
    const user = await Auth.find()
    res.json( {
      user
    } )
  } catch ( error )
  {
    throw Error( error )
  }
}
export const getOneUser = async ( req, res ) =>
{
  try
  {
    const id = req.params.id
    const user = await Auth.findById( id )
    if ( !user || user.length === 0 )
    {
      return res.status( 400 ).json( {
        message: "không có danh sách người dùng "
      } )
    }
    res.json( {
      message: "Lấy người dùng thành công ",
      user
    } )
  } catch ( error )
  {
    console.log( error );

    return res.status( 500 ).json( {
      message: "Lỗi server " + error.message,
    } );
  }
}
export const removeUser = async ( req, res ) =>
{
  try
  {
    const id = req.params.id
    const user = await Auth.findByIdAndDelete( id )
    if ( !user || user.length === 0 )
    {
      return res.status( 400 ).json( {
        message: "không có danh sách người dùng cần xóa  "
      } )
    }
    res.json( {
      message: "xóa thành công "

    } )
  } catch ( error )
  {
    console.log( error );

    return res.status( 500 ).json( {
      message: "Lỗi server " + error.message,
    } );
  }
}
export const updateUser = async ( req, res ) =>
{
  const { _id } = req.user;
  const { name, email, phone } = req.body;

  try
  {
    const existingUser = await Auth.findOne( { email: email } );

    const currentUser = await Auth.findById( _id );
    //kiểm tra xem email có thay đổi hay k 
    if ( currentUser.email !== email )
    {
      if ( existingUser && existingUser._id.toString() !== _id )
      {
        // Nếu email thay đổi thì sẽ check xem  email đã tồn tại và không thuộc về người dùng hiện tại
        return res.status( 400 ).json( { message: "Email đã tồn tại trong hệ thống." } );
      }
      // Nếu email đã thay đổi, thì cập nhật
      currentUser.email = email;
    }

    currentUser.name = name;
    currentUser.phone = phone;




    // Kiểm tra xem email có thay đổi hay không


    const updatedUser = await currentUser.save();

    res.status( 200 ).json( {
      message: "Cập nhật thành công",
      user: updatedUser
    } );
  } catch ( error )
  {
    console.log( error );

    return res.status( 500 ).json( {
      message: "Lỗi server " + error.message,
    } );
  }
}
export const updateUserAdmin = async ( req, res ) =>
{
  const userId = req.params.id; // Lấy ID của người dùng từ URL
  const {
    name,
    email: newEmail, // Đổi tên biến email thành newEmail để không ghi đè lên biến email gốc
    Address,
    address,
    role,
    country,
    phone,
  } = req.body; // Lấy thông tin từ request body

  try
  {
    const existingUserWithEmail = await Auth.findOne( { email: newEmail } ); // Tìm người dùng có email trong hệ thống

    if ( existingUserWithEmail && existingUserWithEmail._id.toString() !== userId )
    {
      // Nếu tồn tại người dùng khác có cùng email và không phải là người dùng đang sửa thông tin
      return res.status( 400 ).json( { message: "Email đã tồn tại trong hệ thống" } );
    }

    // Tiếp tục cập nhật thông tin người dùng nếu không có email trùng khớp
    const user = await Auth.findByIdAndUpdate(
      userId,
      {
        $set: {
          name,
          email: newEmail, // Sử dụng newEmail thay vì email ban đầu
          Address,
          address,
          role,
          country,
          phone,
        },
      },
      { new: true }
    );

    if ( !user )
    {
      return res.status( 404 ).json( { message: "Không tìm thấy người dùng" } );
    }

    return res.status( 200 ).json( { user } );
  } catch ( error )
  {
    return res.status( 500 ).json( { message: "Đã xảy ra lỗi khi cập nhật thông tin người dùng" } );
  }
};
export const logIn = async ( req, res ) =>
{
  try
  {
    const { email, password } = req.body;

    const { error } = loginSchema.validate( req.body, { abortEarly: false } );
    if ( error )
    {
      return res.status( 400 ).json( {
        message: error.details.map( ( err ) => err.message ),
      } );
    }

    const user = await Auth.findOne( { email } );
    if ( !user )
    {
      return res.status( 404 ).json( {
        message: "Tài khoản hoặc mật khẩu không đúng",
      } );
    }
    if ( user.isBlocked )
    {
      return res.status( 403 ).json( {
        message: "Tài khoản của bạn đã bị chặn. Liên hệ với quản trị viên để biết thêm chi tiết.",
      } );
    }

    const passwordHash = await bcrypt.compare( password, user.password );

    if ( !passwordHash )
    {
      return res.status( 404 ).json( {
        message: "Tài khoản hoặc mật khẩu không đúng",
      } );
    }

    const token = jwt.sign( { id: user._id },"  final_secret_key", {
      expiresIn: "1d",
    } );

    user.password = undefined;

    return res.status( 200 ).json( {
      message: "Đăng nhập tài khoản thành công",
      token: token,
    } );
  } catch ( error )
  {
    return res.status( 500 ).json( {
      message: "Lỗi server: " + error.message,
    } );
  }
};
export const logInAdmin = async ( req, res ) =>
{
  try
  {
    const { email, password } = req.body;

    const user = await Auth.findOne( { email } );

    if ( !user || user.role !== 'Admin' )
    {
      return res.status( 404 ).json( {
        message: 'Tài khoản hoặc mật khẩu không đúng hoặc bạn không có quyền Admin',
      } );
    }

    if ( user.isBlocked )
    {
      return res.status( 403 ).json( {
        message: 'Tài khoản của bạn đã bị chặn. Liên hệ với quản trị viên để biết thêm chi tiết.',
      } );
    }

    const passwordMatch = await bcrypt.compare( password, user.password );

    if ( !passwordMatch )
    {
      return res.status( 404 ).json( {
        message: 'Tài khoản hoặc mật khẩu không đúng',
      } );
    }

    const checktoken = jwt.sign( { id: user._id },"  final_secret_key", {
      expiresIn: '3d',
    } );

    user.password = undefined;

    return res.status( 200 ).json( {
      message: 'Đăng nhập tài khoản Admin thành công',
      checktoken: checktoken,
    } );
  } catch ( error )
  {
    return res.status( 500 ).json( {
      message: 'Lỗi server: ' + error.message,
    } );
  }
};
export const getUserByToken = async ( req, res ) =>
{
  try
  {
    if ( !req.headers.authorization )
    {
      return res.status( 401 ).json( {
        message: "Bạn chưa đăng nhập",
      } );
    }

    const token = req.headers.authorization.split( " " )[ 1 ];
    const decoded = jwt.verify( token,"  final_secret_key" );
    const user = await Auth.findById( decoded.id );
    if ( !user )
    {
      return res.status( 401 ).json( {
        message: "Người dùng không tồn tại",
      } );
    }

    res.status( 200 ).json( {
      message: "Cập nhật thành công",
      data: user
    } );
  } catch ( error )
  {
    if ( error instanceof jwt.TokenExpiredError )
    {
      return res.status( 401 ).json( {
        message: "Token đã hết hạn!",
      } );
    } else if ( error instanceof jwt.NotBeforeError )
    {
      return res.status( 401 ).json( {
        message: "Token chưa có hiệu lực!",
      } );
    } else if ( error instanceof jwt.JsonWebTokenError )
    {
      return res.status( 401 ).json( {
        message: "Token không hợp lệ!",
      } );
    }

    console.error( error );
    return res.status( 500 ).json( {
      message: "Đã có lỗi xảy ra!",
    } );
  }
};
export const BlockUser = async ( req, res ) =>
{
  const { id } = req.params
  try
  {
    const block = await Auth.findByIdAndUpdate( id, {
      isBlocked: true
    }, { new: true } )
    res.status( 200 ).json( {
      message: "block thành công ",
      block
    } )
  } catch ( error )
  {
    return res.status( 500 ).json( {
      message: "Lỗi server: " + error.message,
    } );
  }
}
export const unBlockUser = async ( req, res ) =>
{
  const { id } = req.params
  try
  {
    const block = await Auth.findByIdAndUpdate( id, {
      isBlocked: false
    }, { new: true } )
    res.status( 200 ).json( {
      message: "unblock thành công ",
      block
    } )
  } catch ( error )
  {
    return res.status( 500 ).json( {
      message: "Lỗi server: " + error.message,
    } );
  }
}
export const editAddressToken = async ( req, res ) =>
{
  const { _id } = req.user
  try
  {
    const user = await Auth.findByIdAndUpdate( _id, {
      address: req?.body?.address,
      Address: req?.body?.Address,
      country: req?.body?.country
    }, {
      new: true
    } )
    res.json( user )

  } catch ( error )
  {
    return res.status( 500 ).json( {
      message: "Lỗi server: " + error.message,
    } );
  }
}
// Add a route for adding items to the cart
export const addToCart = async ( req, res ) =>
{
  try
  {
    const userId = req.user._id;
    const { productId, size, color, quantity } = req.body;
    const users = await Auth.findById( userId );
    const productInfo = await Product.findById( productId );
    const existingCart = await Cart.findOne( { userId } );
    const priceToUse = productInfo.original_price !== undefined && productInfo.original_price !== null
      ? productInfo.original_price
      : productInfo.price;
    const cartItem = {
      product: productId,
      productVariant: {
        size,
        color,
      },
      quantity,
      productInfo: {
        images: productInfo.images,
        name: productInfo.name,
        brand: productInfo.brand,
        category: productInfo.category,
        price: priceToUse,
        address: users.address
      },
    };

    const variantExists = productInfo.ProductVariants.some(
      ( variant ) => variant.size === size && variant.color === color
    );

    if ( variantExists )
    {
      if ( existingCart )
      {


        const existingItemIndex = existingCart.items.findIndex(
          ( item ) =>
            item.product.toString() === productId &&
            item.productVariant.size === size &&
            item.productVariant.color === color
        );
        if ( existingItemIndex !== -1 )
        {
          const existingItem = existingCart.items[ existingItemIndex ];
          const totalProduct = existingItem.quantity + quantity;

          // Kiểm tra số lượng sản phẩm trong kho và trong giỏ hàng
          if ( totalProduct > 10 )
          {
            return res.status( 400 ).json( {
              message: `Bạn đã thêm quá số lượng hàng cho phép.`,
            } );
          }

          existingItem.quantity += quantity;
        } else
        {
          existingCart.items.push( cartItem );
        }
        const specificVariant = productInfo.ProductVariants.find(
          ( variant ) => variant.size === size && variant.color === color
        );

        // Tìm tổng số lượng biến thể sản phẩm trong giỏ hàng
        const totalQuantityInCart = existingCart
          ? existingCart.items.reduce(
            ( acc, item ) =>
              item.product.toString() === productId &&
                item.productVariant.size === size &&
                item.productVariant.color === color
                ? acc + item.quantity
                : acc,
            0
          )
          : 0;





        if ( totalQuantityInCart > specificVariant.quantity )
        {
          return res.status( 400 ).json( {
            message: `Bạn đã thêm hết biến thể sản phẩm này vào giỏ hàng.`,
          } );
        }

        const productToUpdate = await Product.findById( productId );
        // const variantToUpdate = productToUpdate.ProductVariants.find(
        //   ( variant ) => variant.size === size && variant.color === color
        // );

        // if ( variantToUpdate )
        // {
        //   variantToUpdate.quantity -= quantity;

        //   // Check if the quantity of size or color is less than 0 and return an error
        //   if ( variantToUpdate.quantity < 0 )
        //   {
        //     return res.status( 400 ).json( {
        //       message: `Sản phẩm đã hết size hoặc màu bạn đã chọn (${ size }, ${ color }).`,
        //     } );
        //   }

        //   await productToUpdate.save();
        // }

        await existingCart.save();

        // Calculate total after updating the cart
        let total = 0;
        for ( const item of existingCart.items )
        {
          total += item.productInfo.price * item.quantity;
        }
        existingCart.total = total;
        await existingCart.save();
      } else
      {
        const newCart = new Cart( {
          userId,
          items: [ cartItem ],
        } );

        const productToUpdate = await Product.findById( productId );
        // const variantToUpdate = productToUpdate.ProductVariants.find(
        //   ( variant ) => variant.size === size && variant.color === color
        // );

        // if ( variantToUpdate )
        // {
        //   variantToUpdate.quantity -= quantity;

        //   // Check if the quantity of size or color is less than 0 and return an error
        //   if ( variantToUpdate.quantity < 0 )
        //   {
        //     return res.status( 400 ).json( {
        //       message: `Sản phẩm đã hết size hoặc màu bạn đã chọn (${ size }, ${ color }).`,
        //     } );
        //   }

        //   await productToUpdate.save();
        // }

        await newCart.save();

        // Calculate total after saving the new cart
        let total = 0;
        for ( const item of newCart.items )
        {
          total += item.productInfo.price * item.quantity;
        }
        newCart.total = total;
        await newCart.save();
      }

      return res.status( 200 ).json( {
        message: "Đã thêm sản phẩm vào giỏ hàng.",
      } );
    } else
    {
      return res.status( 400 ).json( {
        message: "Size hoặc màu không hợp lệ cho sản phẩm này.",
      } );
    }
  } catch ( error )
  {
    console.error( error );
    return res.status( 500 ).json( {
      message: "Lỗi máy chủ: " + error.message,
    } );
  }
};
export const removeFromCart = async ( req, res ) =>
{
  try
  {
    const userId = req.user._id;
    const productId = req.params.id; // Lấy productId từ URL

    // Tìm giỏ hàng của người dùng
    const existingCart = await Cart.findOne( { userId } );

    if ( !existingCart )
    {
      return res.status( 404 ).json( {
        message: "Giỏ hàng không tồn tại.",
      } );
    }

    // Tìm index của sản phẩm cần xóa trong mảng items của giỏ hàng
    const itemIndex = existingCart.items.findIndex(
      ( item ) => item.product.toString() === productId
    );

    if ( itemIndex === -1 )
    {
      return res.status( 404 ).json( {
        message: "Sản phẩm không tồn tại trong giỏ hàng.",
      } );
    }

    // Xóa sản phẩm khỏi mảng items
    existingCart.items.splice( itemIndex, 1 );

    // Cập nhật tổng giá trị sau khi xóa sản phẩm
    let total = 0;
    for ( const item of existingCart.items )
    {
      total += item.productInfo.price * item.quantity;
    }
    existingCart.total = total;

    // Lưu thay đổi vào cơ sở dữ liệu
    await existingCart.save();

    return res.status( 200 ).json( {
      message: "Đã xóa sản phẩm khỏi giỏ hàng.",
    } );
  } catch ( error )
  {
    console.error( error );
    return res.status( 500 ).json( {
      message: "Lỗi máy chủ: " + error.message,
    } );
  }
};
export const getUserCart = async ( req, res ) =>
{
  const { _id } = req.user
  try
  {
    const getUser = await Cart.findOne( { userId: _id } ).populate( "items.product" ).populate( "userId" );
    res.json( getUser )
  } catch ( error )
  {
    throw new Error( error )
  }
}
export const emptyCart = async ( req, res ) =>
{
  const { _id } = req.user
  try
  {
    const user = await Auth.findOne( { _id } );
    const cart = await Cart.findOneAndRemove( { userId: user._id } )
    res.json( cart )
  } catch ( error )
  {
    throw new Error( error )
  }
}
export const updateOrderStatus = async ( req, res, next ) =>
{
  const { status } = req.body;
  const { id } = req.params;
  const { _id } = req.user;

  try
  {
    const existingOrder = await order.findById( id );

    // Kiểm tra nếu đơn hàng đã chuyển trạng thái nhất định
    if (
      existingOrder.status === "Đã hoàn thành" ||
      existingOrder.status === "Đã hủy" ||
      existingOrder.status === "đang chờ được xử lý" ||
      existingOrder.status === "Đã hoàn tiền"
    )
    {
      return res.status( 400 ).json( {
        error: "Không thể thay đổi trạng thái của đơn hàng này",
      } );
    }

    const isAllowedToChange = canChangeToNewStatus( existingOrder, status );

    if ( !isAllowedToChange )
    {
      return res.status( 400 ).json( {
        error: "Không thể quay lại trạng thái này",
      } );
    }

    // Thêm trạng thái mới vào lịch sử trạng thái
    existingOrder.statusHistory.push( {
      status: status,
      updatedBy: _id, // ID của người thực hiện hành động
      updatedAt: new Date(),
    } );

    // Cập nhật trạng thái mới cho đơn hàng
    existingOrder.status = status;
    const updatedOrder = await existingOrder.save();

    // Check if the order status is "Đã hủy" or "Đã hoàn tiền"
    if ( status === "Đã hủy" || status === "Đã hoàn tiền" )
    {
      // Iterate through the order items and update product quantities and sold values
      for ( const item of updatedOrder.products )
      {
        const { product, quantity } = item;

        // Update overall product quantity and sold count
        await Product.updateOne(
          { _id: product._id },
          { $inc: { quantity, sold: -quantity } }
        );

        // Update each ProductVariant quantity
        const { productVariant } = item;
        const { size, color } = productVariant;

        // Cập nhật số lượng cho một size và color cụ thể
        await Product.findOneAndUpdate(
          {
            _id: product._id,
            "ProductVariants.size": size,
            "ProductVariants.color": color,
          },
          { $inc: { "ProductVariants.$.quantity": quantity } }
        );
      }
    }

    res.json( updatedOrder );
  } catch ( error )
  {
    return next( error );
  }
};
export const updateOrderStatusUser = async ( req, res, next ) =>
{
  const { status } = req.body;
  const { id } = req.params;
  const { _id } = req.user;

  try
  {
    const existingOrder = await order.findById( id );

    // Kiểm tra nếu đơn hàng đã chuyển trạng thái nhất định
    if (
      existingOrder.status === "Đã hoàn thành" ||
      existingOrder.status === "Đã hủy" ||
      existingOrder.status === "đang chờ được xử lý" ||
      existingOrder.status === "Đã hoàn tiền"
    )
    {
      return res.status( 400 ).json( {
        error: "Không thể thay đổi trạng thái của đơn hàng này",
      } );
    }

    const isAllowedToChange = canChangeToNewStatus( existingOrder, status );

    if ( !isAllowedToChange )
    {
      return res.status( 400 ).json( {
        error: "Không thể quay lại trạng thái này",
      } );
    }

    // Thêm trạng thái mới vào lịch sử trạng thái
    existingOrder.statusHistory.push( {
      status: status,
      updatedBy: _id, // ID của người thực hiện hành động
      updatedAt: new Date(),
    } );

    // Cập nhật trạng thái mới cho đơn hàng
    existingOrder.status = status;
    const updatedOrder = await existingOrder.save();

    // Check if the order status is "Đã hủy" or "Đã hoàn tiền"
    if ( status === "Đã hủy" || status === "Đã hoàn tiền" )
    {
      // Iterate through the order items and update product quantities and sold values
      for ( const item of updatedOrder.products )
      {
        const { product, quantity } = item;

        // Update overall product quantity and sold count
        await Product.updateOne(
          { _id: product._id },
          { $inc: { quantity, sold: -quantity } }
        );

        // Update each ProductVariant quantity
        const { productVariant } = item;
        const { size, color } = productVariant;

        // Cập nhật số lượng cho một size và color cụ thể
        await Product.findOneAndUpdate(
          {
            _id: product._id,
            "ProductVariants.size": size,
            "ProductVariants.color": color,
          },
          { $inc: { "ProductVariants.$.quantity": quantity } }
        );
      }
    }

    res.json( updatedOrder );
  } catch ( error )
  {
    return next( error );
  }
};
const canChangeToNewStatus = ( existingOrder, newStatus ) =>
{
  // Lấy lịch sử trạng thái của đơn hàng
  const statusHistory = existingOrder.statusHistory.map( ( item ) => item.status );

  // Kiểm tra trạng thái ban đầu của đơn hàng (lấy trạng thái đầu tiên trong lịch sử)
  const initialStatus = statusHistory[ 0 ];

  // Kiểm tra nếu trạng thái muốn chuyển đến không phải là trạng thái ban đầu
  if ( newStatus === initialStatus )
  {
    return false; // Trạng thái mới muốn chuyển đến là trạng thái ban đầu, không hợp lệ
  }

  // Kiểm tra nếu trạng thái muốn chuyển đến đã từng được chuyển qua từ trạng thái ban đầu
  const hasChangedToNewStatus = statusHistory.includes( newStatus );

  return !hasChangedToNewStatus;
};
export const applyCoupon = async ( req, res ) =>
{
  const { _id } = req.user;
  const { voucher } = req.body;

  const user = await Auth.findOne( { _id } ).populate( 'vouchers' );
  const cart = await Cart.findOne( { userId: user._id } ).populate( 'items.product' );

  const userVoucher = user.vouchers.find( v => v.code === voucher );
  console.log( cart.total );
  if ( !userVoucher )
  {
    return res.status( 400 ).json( {
      error: "bạn chưa có mã giảm giá này",
    } );
  }

  // Lấy thông tin về mã giảm giá từ collection Voucher để kiểm tra hạn sử dụng và giới hạn tiền
  const validCoupon = await Voucher.findOne( { code: voucher } );

  // Kiểm tra tính hợp lệ của mã giảm giá
  const currentDate = new Date();
  if ( currentDate <= new Date( validCoupon.endDate ) && currentDate >= new Date( validCoupon.startDate ) && cart.total >= userVoucher.minimumOrderAmount )
  {
    // Check xem mã giảm giá còn khả dụng không
    const availableVoucher = await Voucher.findOne( { code: voucher, limit: { $gt: 0 } } );

    if ( !availableVoucher )
    {
      return res.json( { error: "Mã giảm giá đã hết hoặc không hợp lệ." } );
    }

    // Tiếp tục xử lý áp dụng mã giảm giá
    let totalAfterDiscount = ( cart.total - ( cart.total * validCoupon.discount ) / 100 ).toFixed( 2 );

    // Cập nhật giỏ hàng với giá mới và mã giảm giá đã sử dụng
    await Cart.findOneAndUpdate(
      { userId: user._id },
      { totalAfterDiscount },
      { new: true }
    );
    res.json( totalAfterDiscount );
  } else
  {
    res.json( { error: "Mã giảm giá không hợp lệ hoặc đơn hàng không đạt yêu cầu." } );
  }
};
export const createOrder = async ( req, res ) =>
{
  const { COD, address, VNPAY, couponApplied, TTONL, Address, shippingType, phone, discountCode, country } = req.body;
  const { _id } = req.user;

  try
  {
    let method = "COD";
    let paymentStatus = "thanh toán khi nhận hàng";

    if ( TTONL )
    {
      method = "TTONL";
      paymentStatus = "Paypal";
    } else
      if ( VNPAY )
      {
        method = "VNPAY";
        paymentStatus = "VNPAY";
      } else if ( !COD )
      {
        throw new Error( "Lỗi khi chọn phương thức thanh toán" );
      }

    let shippingFee = 0;
    if ( shippingType === 'nhanh' )
    { // Xác định loại vận chuyển
      shippingFee = 30000; // Nếu là giao hàng tiết kiệm, tăng phí vận chuyển lên 30k
    } else if ( shippingType === 'hỏa tốc' )
    {
      shippingFee = 50000; // Nếu là giao hàng hỏa tốc, tăng phí vận chuyển lên 50k
    }
    const updatedUser = await Auth.findByIdAndUpdate(
      _id,
      { $set: { address, phone, Address, country } },
      { new: true }
    );
    if ( !updatedUser )
    {
      throw new Error( "User not found" );
    }
    const user = await Auth.findById( _id );
    let userCart = await Cart.findOne( { userId: updatedUser._id } );
    let finalAmount = couponApplied && userCart.totalAfterDiscount ? userCart.totalAfterDiscount + shippingFee : userCart.total + shippingFee;

    let newOrder = await new order( {
      products: userCart.items,
      paymentIntent: {
        id: uniqid(),
        method: method,
        amount: finalAmount,
        status: "thanh toán thành công",
        created: Date.now(),
        currency: "VND",
      },
      userId: updatedUser._id,
      paymentStatus: paymentStatus,
      address,
      Address,
      phone,
      shippingType,
      discountCode,
      country
    } ).save();
    const newStatus = {
      status: "Đang xử lý",
      updatedBy: _id,
      updatedAt: Date.now(), // Ngày giờ cập nhật
    };
    if ( couponApplied )
    {
      const usedVoucher = await Voucher.findOneAndUpdate(
        { code: discountCode }, // Sử dụng mã giảm giá từ đơn hàng để xác định voucher đã sử dụng
        { $inc: { limit: -1 } },
        { new: true }
      );
      console.log( usedVoucher );
      if ( !usedVoucher )
      {
        throw new Error( "Không tìm thấy mã giảm giá đã sử dụng" );
      }
    }
    // Thêm status mới vào statusHistory của đơn hàng
    await order.findByIdAndUpdate(
      newOrder._id,
      {
        $push: { statusHistory: newStatus },
      },
      { new: true }
    );
    // Clear the user's cart after creating the order
    await Cart.findOneAndDelete( { userId: user._id } );

    let update = userCart.items.map( ( item ) =>
    {
      return {
        updateOne: {
          filter: { _id: item.product._id },
          update: { $inc: { sold: +item.quantity } },
        },
      };
    } );
    for ( const item of userCart.items )
    {
      const product = await Product.findById( item.product._id ); // Tìm sản phẩm theo ID
      console.log( product );
      // Tìm biến thể sản phẩm dựa trên size và color trong item.productVariant
      const specificVariant = product.ProductVariants.find(
        ( variant ) => variant.size === item.productVariant.size && variant.color === item.productVariant.color
      );
      console.log( specificVariant );
      // Giảm số lượng của biến thể sản phẩm
      if ( specificVariant )
      {
        specificVariant.quantity -= item.quantity;
        await product.save(); // Lưu sản phẩm sau khi giảm số lượng
      }
    }
    const updated = await Product.bulkWrite( update, {} );
    return res.json( { message: "success", newOrder } );
  } catch ( error )
  {
    return res.status( 500 ).json( { error: "Internal server error" } );
  }
};
function sortObject ( obj )
{
  let sorted = {};
  let str = [];
  let key;
  for ( key in obj )
  {
    if ( obj.hasOwnProperty( key ) )
    {
      str.push( encodeURIComponent( key ) );
    }
  }
  str.sort();
  for ( key = 0; key < str.length; key++ )
  {
    sorted[ str[ key ] ] = encodeURIComponent( obj[ str[ key ] ] ).replace( /%20/g, "+" );
  }
  return sorted;
}
export const createPaymentUrl = async ( req, res ) =>
{
  const { amount, address, Address, shippingType, phone, discountCode, couponApplied, country } = req.body;
  const { _id } = req.user
  try
  {
    let date = new Date();
    let createDate = moment( date ).format( 'YYYYMMDDHHmmss' );
    let ipAddr = req.headers[ 'x-forwarded-for' ] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;
    let tmnCode = process.env.VNP_TMN_CODE;
    let secretKey = process.env.VNP_HASH_SECRET;
    let vnpUrl = process.env.VNP_URL;
    let returnUrl = process.env.VNP_RETURN_URL;
    let currCode = 'VND';
    let orderId = moment( date ).format( 'DDHHmmss' );
    let vnp_Params = {};
    vnp_Params[ 'vnp_Version' ] = '2.1.0';
    vnp_Params[ 'vnp_Command' ] = 'pay';
    vnp_Params[ 'vnp_TmnCode' ] = tmnCode;
    vnp_Params[ 'vnp_Locale' ] = "vn";
    vnp_Params[ 'vnp_CurrCode' ] = currCode;
    vnp_Params[ 'vnp_TxnRef' ] = orderId;
    vnp_Params[ 'vnp_OrderInfo' ] = 'Thanh toan cho ma GD:' + orderId;
    vnp_Params[ 'vnp_OrderType' ] = 'other';
    vnp_Params[ 'vnp_Amount' ] = amount * 100;
    vnp_Params[ 'vnp_ReturnUrl' ] = returnUrl;
    vnp_Params[ 'vnp_IpAddr' ] = ipAddr;
    vnp_Params[ 'vnp_CreateDate' ] = createDate;
    vnp_Params = sortObject( vnp_Params );
    let signData = qs.stringify( vnp_Params, { encode: false } );
    let hmac = crypto.createHmac( "sha512", secretKey );
    let signed = hmac.update( new Buffer( signData, 'utf-8' ) ).digest( "hex" );
    vnp_Params[ 'vnp_SecureHash' ] = signed;
    vnpUrl += '?' + qs.stringify( vnp_Params, { encode: false } );

    let shippingFee = 0;
    if ( shippingType === 'nhanh' )
    { // Xác định loại vận chuyển
      shippingFee = 30000; // Nếu là giao hàng tiết kiệm, tăng phí vận chuyển lên 30k
    } else if ( shippingType === 'hỏa tốc' )
    {
      shippingFee = 50000; // Nếu là giao hàng hỏa tốc, tăng phí vận chuyển lên 50k
    }
    const updatedUser = await Auth.findByIdAndUpdate(
      _id,
      { $set: { address, phone, Address, country } },
      { new: true }
    );
    if ( !updatedUser )
    {
      throw new Error( "User not found" );
    }
    const user = await Auth.findById( _id );
    let userCart = await Cart.findOne( { userId: updatedUser._id } );
    let finalAmount = couponApplied && userCart.totalAfterDiscount ? userCart.totalAfterDiscount + shippingFee : userCart.total + shippingFee;

    let newOrder = await new order( {
      products: userCart.items,
      paymentIntent: {
        id: uniqid(),
        method: "VNPAY",
        amount: finalAmount,
        status: "thanh toán thành công",
        created: Date.now(),
        currency: "VND",
      },
      userId: updatedUser._id,
      paymentStatus: "VNPAY",
      address,
      Address,
      phone,
      shippingType,
      discountCode,
      country
    } ).save();
    const newStatus = {
      status: "Đang xử lý",
      updatedBy: _id,
      updatedAt: Date.now(), // Ngày giờ cập nhật
    };

    if ( couponApplied )
    {
      const usedVoucher = await Voucher.findOneAndUpdate(
        { code: discountCode }, // Sử dụng mã giảm giá từ đơn hàng để xác định voucher đã sử dụng
        { $inc: { limit: -1 } },
        { new: true }
      );
      console.log( usedVoucher );
      if ( !usedVoucher )
      {
        throw new Error( "Không tìm thấy mã giảm giá đã sử dụng" );
      }
    }
    // Thêm status mới vào statusHistory của đơn hàng
    await order.findByIdAndUpdate(
      newOrder._id,
      {
        $push: { statusHistory: newStatus },
      },
      { new: true }
    );
    // Clear the user's cart after creating the order
    await Cart.findOneAndDelete( { userId: user._id } );

    let update = userCart.items.map( ( item ) =>
    {
      return {
        updateOne: {
          filter: { _id: item.product._id },
          update: { $inc: { sold: +item.quantity } },
        },
      };
    } );
    for ( const item of userCart.items )
    {
      const product = await Product.findById( item.product._id ); // Tìm sản phẩm theo ID
      console.log( product );
      // Tìm biến thể sản phẩm dựa trên size và color trong itemToIncrease.productVariant
      const specificVariant = product.ProductVariants.find(
        ( variant ) => variant.size === item.productVariant.size && variant.color === item.productVariant.color
      );

      // Giảm số lượng của biến thể sản phẩm
      if ( specificVariant )
      {
        specificVariant.quantity -= item.quantity;
        await product.save(); // Lưu sản phẩm sau khi giảm số lượng
      }
    }
    const updated = await Product.bulkWrite( update, {} );

    return res.status( 200 ).json( {
      message: "Truy cập đường dẫn",
      url: vnpUrl,


    } );
  } catch ( error )
  {
    console.error( error );

  }
}
export const vnpayReturn = async ( req, res ) =>
{

  try
  {

    // Nhận Tham số từ VNPay
    let vnp_Params = req.query;

    // Lấy và Xác Minh Chữ Ký An toàn
    let secureHash = vnp_Params[ 'vnp_SecureHash' ];
    delete vnp_Params[ 'vnp_SecureHash' ];
    delete vnp_Params[ 'vnp_SecureHashType' ];

    // Sắp Xếp và Chuẩn Bị Dữ liệu để Xác Minh Chữ Ký
    vnp_Params = sortObject( vnp_Params );

    // Lấy Cấu Hình và Khóa Bí mật
    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;

    // Tạo và Xác Minh Chữ Ký
    let signData = qs.stringify( vnp_Params, { encode: false } );
    let hmac = crypto.createHmac( "sha512", secretKey );
    let signed = hmac.update( new Buffer( signData, 'utf-8' ) ).digest( "hex" );
    console.log( signData );
    // Xử lý Kết Quả và Hiển Thị Trang Tương Ứng
    if ( secureHash === signed )
    {

      return res.redirect( "http://localhost:5173/ordersuccess" );


    } else
    {
      // Xử lý khi chữ ký không hợp lệ
      return res.status( 400 ).json( { error: 'Chữ ký không hợp lệ' } );
    }

  } catch ( error )
  {
    return res.status( 500 ).json( { error: 'Lỗi máy chủ nội bộ' } );
  }
}
const changeStatusPayment = async ( _id ) =>
{
  try
  {
    const cart = await Auth.findById( _id );
    console.log( cart );

    return true
    // Kiểm tra và cập nhật thông tin người dùng nếu 
    // Thực hiện các tác vụ khác nếu cần

  } catch ( error )
  {
    console.error( error );
    return false; // Trả về false nếu có lỗi
  }
};

export const getOrders = async ( req, res ) =>
{
  const { _id } = req.user
  try
  {
    const Order = await order.find( { userId: _id } ).populate( "products" ).populate( "statusHistory.updatedBy" ).sort( { createdAt: -1 } ).exec();
    res.json( {
      Order
    } )
  } catch ( error )
  {
    throw new Error( error )
  }
}
export const getAllOrders = async ( req, res ) =>
{
  try
  {
    const Order = await order.find().populate( "products.product" ).populate( "statusHistory.updatedBy" ).populate( "userId" ).sort( { createdAt: -1 } ).exec();
    res.json( { Order } )
  } catch ( error )
  {
    throw new Error( error )
  }
}

export const getoneOrders = async ( req, res ) =>
{
  const id = req.params.id
  try
  {
    const Order = await order.findById( id )
      .populate( {
        path: 'products.productInfo.category', // Đường dẫn đến category trong productInfo
        model: 'Category' // Tên của model Category
      } )
      .populate( 'products.product' ).populate( "statusHistory.updatedBy" ).populate( "userId" ) // Populate product (nếu có)
      .exec();
    res.json(
      Order
    )
  } catch ( error )
  {
    throw new Error( error )
  }
}
export const getoneOrdersAdmin = async ( req, res ) =>
{
  const id = req.params.id
  try
  {
    const Order = await order.findById( id )
      .populate( {
        path: 'products.productInfo.category', // Đường dẫn đến category trong productInfo
        model: 'Category' // Tên của model Category
      } )
      .populate( 'products.product' ).populate( "statusHistory.updatedBy" ).populate( "userId" ) // Populate product (nếu có)
      .exec();
    res.json(
      Order
    )
  } catch ( error )
  {
    throw new Error( error )
  }
}
// API endpoint cho người dùng yêu cầu hủy đơn hàng
export const cancelOrderRequest = async ( req, res ) =>
{
  const { id } = req.params; // ID của đơn hàng
  const { reason } = req.body; // Lý do hủy đơn hàng từ người dùng
  const { _id } = req.user
  try
  {
    const user = await Auth.findById( _id )
    const Order = await order.findById( id );

    // Kiểm tra trạng thái của đơn hàng trước khi hủy
    if ( Order.cancelReason )
    {
      return res.status( 400 ).json( { error: 'Đơn hàng đã được gửi yêu cầu trước đó' } );
    }
    const updatedStatusHistory = Order.statusHistory || [];
    updatedStatusHistory.push( {
      status: 'đang chờ được xử lý', // hoặc trạng thái mới mà bạn muốn thêm vào
      updatedAt: new Date(),
      updatedBy: user._id, // hoặc thông tin người cập nhật
    } );

    // Tìm đơn hàng dựa trên ID và cập nhật thông tin hủy đơn hàng
    const updatedOrder = await order.findByIdAndUpdate(
      id,
      { status: 'đang chờ được xử lý', cancelReason: reason, cancelRequest: true, statusHistory: updatedStatusHistory }, // Cập nhật cancelReason
      { new: true }
    );

    // Gửi email thông báo khi có yêu cầu hủy đơn hàng
    const transporter = nodemailer.createTransport( {
      service: 'gmail',
      auth: {
        user: 'thanhnvph26404@gmail.com', // Email của bạn
        pass: 'ricjggvzlskbtsxl', // Mật khẩu email của bạn
      },
    } );

    const mailOptions = {
      from: 'yourEmail@gmail.com',
      to: 'honggiang22112003@gmail.com', // Địa chỉ email muốn gửi thông báo đến
      subject: 'Yêu cầu hủy đơn hàng',
      text: `Đơn hàng ${ id } yêu cầu hủy với lý do: ${ reason } bạn hãy check tài khoản của mình`,
    };

    transporter.sendMail( mailOptions, ( error, info ) =>
    {
      if ( error )
      {
        console.log( 'Error occurred while sending email:', error );
      } else
      {
        console.log( 'Email sent:', info.response );
      }
    } );

    res.json( updatedOrder );
  } catch ( error )
  {
    return res.status( 500 ).json( { error: 'Lỗi server: ' + error.message } );
  }
};

// API endpoint cho quản trị viên xác nhận yêu cầu hủy đơn hàng
export const confirmCancelOrder = async ( req, res ) =>
{
  const { id } = req.params; // ID của đơn hàng
  const { isConfirmed } = req.body; // Xác nhận hoặc từ chối yêu cầu hủy đơn hàng từ quản trị viên
  const { email } = req.user
  const { _id } = req.user

  try
  {
    // Tìm đơn hàng dựa trên ID

    const orderToCancel = await order.findById( id );

    if ( !orderToCancel )
    {
      return res.status( 404 ).json( { error: 'Đơn hàng không tồn tại.' } );
    }

    const userId = orderToCancel.userId;
    const user = await Auth.findById( userId )
    if ( !user )
    {
      return res.status( 404 ).json( { message: 'Không tìm thấy thông tin người dùng' } );
    }

    const userEmail = user.email;
    if ( isConfirmed )
    {
      const updatedStatusHistory = orderToCancel.statusHistory || [];
      updatedStatusHistory.push( {
        status: 'Đã hủy', // hoặc trạng thái mới mà bạn muốn thêm vào
        updatedAt: new Date(),
        updatedBy: user._id, // hoặc thông tin người cập nhật
      } );
      // Nếu quản trị viên chấp nhận hủy đơn hàng
      await order.findByIdAndUpdate(
        id,
        { status: 'Đã hủy', cancelReason: orderToCancel.cancelReason, statusHistory: updatedStatusHistory },
        { new: true }
      );
      for ( const item of orderToCancel.products )
      {
        const { product, quantity, productVariant } = item;

        await Product.updateOne(
          { _id: product._id },
          { $inc: { quantity, sold: -quantity } }
        );

        const { size, color } = productVariant;

        await Product.findOneAndUpdate(
          {
            _id: product._id,
            "ProductVariants.size": size,
            "ProductVariants.color": color,
          },
          { $inc: { "ProductVariants.$.quantity": quantity } }
        );
      }



      // Gửi email thông báo cho người dùng đăng nhập
      const transporter = nodemailer.createTransport( {
        service: 'gmail',
        auth: {
          user: 'thanhnvph26404@gmail.com', // Email của bạn
          pass: 'ricjggvzlskbtsxl', // Mật khẩu email của bạn
        },
      } );

      const mailOptions = {
        from: 'yourEmail@gmail.com',
        to: userEmail, // Email người dùng đăng nhập
        subject: 'Xác nhận hủy đơn hàng',
        text: `Đơn hàng ${ id } đã được hủy.`,
      };

      transporter.sendMail( mailOptions, ( error, info ) =>
      {
        if ( error )
        {
          console.log( 'Error occurred while sending email:', error );
        } else
        {
          console.log( 'Email sent:', info.response );
        }
      } );

      res.json( { message: 'Đơn hàng đã được hủy.' } );
    } else
    {
      // Nếu quản trị viên từ chối yêu cầu hủy đơn hàng
      // Thay đổi trạng thái về "Đang giao hàng"
      const updatedStatusHistory = orderToCancel.statusHistory || [];
      updatedStatusHistory.push( {
        status: 'Đang giao hàng', // hoặc trạng thái mới mà bạn muốn thêm vào
        updatedAt: new Date(),
        updatedBy: user._id, // hoặc thông tin người cập nhật
      } );
      await order.findByIdAndUpdate(
        id,
        { status: 'Đang giao hàng', cancelReason: orderToCancel.cancelReason, cancelRequest: false, statusHistory: updatedStatusHistory },
        { new: true }
      );

      // Gửi email thông báo cho người dùng đăng nhập
      const transporter = nodemailer.createTransport( {
        service: 'gmail',
        auth: {
          user: 'thanhnvph26404@gmail.com', // Email của bạn
          pass: 'ricjggvzlskbtsxl', // Mật khẩu email của bạn
        },
      } );

      const mailOptions = {
        from: 'yourEmail@gmail.com',
        to: userEmail, // Email người dùng đăng nhập
        subject: 'Từ chối hủy đơn hàng',
        text: `Yêu cầu hủy đơn hàng ${ id } không được chấp nhận.`,
      };

      transporter.sendMail( mailOptions, ( error, info ) =>
      {
        if ( error )
        {
          console.log( 'Error occurred while sending email:', error );
        } else
        {
          console.log( 'Email sent:', info.response );
        }
      } );

      res.json( { message: 'Đơn hàng không thể hủy.' } );
    }
  } catch ( error )
  {
    return res.status( 500 ).json( { error: 'Lỗi server: ' + error.message } );
  }
};
export const getCancelledOrders = async ( req, res ) =>
{
  try
  {
    const cancelledOrders = await order.find( { cancelRequest: true } );
    res.json( cancelledOrders );
  } catch ( error )
  {
    return res.status( 500 ).json( { error: "Lỗi server: " + error.message } );
  }
};
export const getCancelledtrueOrders = async ( req, res ) =>
{
  const { status, startDates, endDates } = req.body;

  try
  {
    let query = {};

    if ( status && startDates && endDates )
    {
      query.createdAt = { $gte: new Date( startDates ), $lte: new Date( endDates ) };
      query.status = status;
    } else if ( startDates && endDates )
    {
      query.createdAt = { $gte: new Date( startDates ), $lte: new Date( endDates ) };
    } else if ( status )
    {
      query.status = status;
    } else
    {
      return res.status( 400 ).json( { error: "Vui lòng cung cấp ít nhất một trường thông tin." } );
    }

    const orders = await order.find( query ).populate( "userId" );
    const totalOrders = orders.length; // Số lượng đơn hàng

    // Gửi kết quả trả về với số lượng đơn hàng
    res.json( { orders, totalOrders } );
  } catch ( error )
  {
    return res.status( 500 ).json( { error: "Lỗi server: " + error.message } );
  }
};
export const findOrderByid = async ( req, res ) =>
{
  const { orderId } = req.body;

  try
  {
    if ( !orderId )
    {
      return res.status( 400 ).json( { error: "Vui lòng cung cấp ID đơn hàng." } );
    }

    const foundOrder = await order.findOne( { "paymentIntent.id": orderId } ).populate( "userId" );

    if ( !foundOrder )
    {
      return res.status( 404 ).json( { error: "Không tìm thấy đơn hàng với ID này trong paymentIntent." } );
    }

    res.json( foundOrder );
  } catch ( error )
  {
    return res.status( 500 ).json( { error: "Lỗi server: " + error.message } );
  }
};
export const findOrderByPhone = async ( req, res ) =>
{
  const { phone } = req.body;

  try
  {
    if ( !phone )
    {
      return res.status( 400 ).json( { error: "Vui lòng cung cấp số điện thoại đơn hàng." } );
    }

    const foundOrder = await order.find( { phone: phone } ).populate( "userId" );

    if ( !foundOrder )
    {
      return res.status( 404 ).json( { error: "Không tìm thấy đơn hàng với ID này trong paymentIntent." } );
    }

    res.json( foundOrder );
  } catch ( error )
  {
    return res.status( 500 ).json( { error: "Lỗi server: " + error.message } );
  }
};
export const increaseQuantity = async ( req, res ) =>
{
  const { _id } = req.user;
  const { id } = req.params; // Lấy itemId từ URL
  const { increaseBy } = req.body;

  try
  {
    const existingCart = await Cart.findOne( { userId: _id } );
    if ( !existingCart )
    {
      return res.status( 404 ).json( { message: 'Giỏ hàng không tồn tại' } );
    }

    const itemToIncrease = existingCart.items.find( item => item._id.toString() === id );
    if ( !itemToIncrease )
    {
      return res.status( 404 ).json( { message: 'Sản phẩm không tồn tại trong giỏ hàng' } );
    }
    const { size, color } = itemToIncrease.productVariant; // Lấy thông tin size và color của sản phẩm trong giỏ hàng
    // Tìm biến thể sản phẩm từ mô hình ProductVariants
    // Tìm sản phẩm dựa trên itemToIncrease.product
    const product = await Product.findById( itemToIncrease.product );
    console.log( product );
    // Tìm biến thể sản phẩm từ mô hình ProductVariants của sản phẩm này
    const specificVariant = product.ProductVariants.find(
      variant => variant.size === itemToIncrease.productVariant.size && variant.color === itemToIncrease.productVariant.color
    );
    // Kiểm tra số lượng còn lại của biến thể sản phẩm
    if ( specificVariant.quantity < itemToIncrease.quantity + increaseBy )
    {
      return res.status( 400 ).json( { message: 'Quá số lượng màu và size' } );
    }


    // Lưu trữ số lượng trước khi thay đổi
    const previousQuantity = itemToIncrease.quantity;

    // Tăng số lượng sản phẩm
    itemToIncrease.quantity += increaseBy;
    await existingCart.save();

    // Tính lại tổng tiền sau khi thay đổi
    const total = existingCart.items.reduce( ( acc, item ) =>
    {
      return acc + ( item.productInfo.price * item.quantity );
    }, 0 );

    // Cập nhật tổng tiền trong giỏ hàng
    existingCart.total = total;
    await existingCart.save();

    return res.status( 200 ).json( { message: 'Số lượng sản phẩm đã được tăng' } );
  } catch ( error )
  {
    console.error( error );
    return res.status( 500 ).json( { message: 'Lỗi máy chủ: ' + error.message } );
  }
};

export const decreaseQuantity = async ( req, res ) =>
{
  const { _id } = req.user;
  const { id } = req.params; // Lấy itemId từ URL
  const { decreaseBy } = req.body;

  try
  {
    const existingCart = await Cart.findOne( { userId: _id } );
    if ( !existingCart )
    {
      return res.status( 404 ).json( { message: 'Giỏ hàng không tồn tại' } );
    }

    const itemToDecrease = existingCart.items.find( item => item._id.toString() === id );
    if ( !itemToDecrease )
    {
      return res.status( 404 ).json( { message: 'Sản phẩm không tồn tại trong giỏ hàng' } );
    }

    // Lưu trữ số lượng trước khi thay đổi
    const previousQuantity = itemToDecrease.quantity;

    // Giảm số lượng sản phẩm
    itemToDecrease.quantity -= decreaseBy;
    // Kiểm tra nếu số lượng nhỏ hơn 0 thì có thể xử lý ở đây

    await existingCart.save();

    // Tính lại tổng tiền sau khi thay đổi
    const total = existingCart.items.reduce( ( acc, item ) =>
    {
      return acc + ( item.productInfo.price * item.quantity );
    }, 0 );

    // Cập nhật tổng tiền trong giỏ hàng
    existingCart.total = total;
    await existingCart.save();

    return res.status( 200 ).json( { message: 'Số lượng sản phẩm đã được giảm' } );
  } catch ( error )
  {
    console.error( error );
    return res.status( 500 ).json( { message: 'Lỗi máy chủ: ' + error.message } );
  }
};
export const getWishList = async ( req, res ) =>
{
  const { _id } = req.user

  try
  {
    const getWish = await Auth.findById( _id ).populate( "wishList" )
    res.json( getWish )
  } catch ( error )
  {
    throw new Error( error )
  }
}
export const removeWishList = async ( req, res ) =>
{
  const { _id } = req.user
  const productId = req.params.id;
  try
  {
    const User = await Auth.findOne( { _id } )
    if ( !User )
    {
      return res.status( 404 ).json( {
        message: "người dùng không tồn tại.",
      } )
    }
    const WishList = User.wishList.findIndex( ( item ) =>
      item._id.toString() === productId );
    if ( WishList === -1 )
    {
      return res.status( 404 ).json( {
        message: "Sản phẩm không tồn tại trong sản phẩm yêu thích .",
      } );
    }
    User.wishList.splice( WishList, 1 )
    await User.save();
    return res.status( 200 ).json( {
      message: "Đã xóa sản phẩm khỏi danh sách.",
    } );

  } catch ( error )
  {
    console.error( error );
    return res.status( 500 ).json( {
      message: "Lỗi máy chủ: " + error.message,
    } );
  }
}
export const cancleOrder = async ( req, res ) =>
{
  const { id } = req.params;
  const { cancelReason } = req.body;

  const { _id } = req.user
  try
  {
    // Tìm đơn hàng theo orderId
    const orders = await order.findById( id );
    if ( !orders )
    {
      return res.status( 404 ).json( { message: "Không tìm thấy đơn hàng" } );
    }
    const userId = orders.userId;
    console.log( userId );
    const user = await Auth.findById( userId );
    if ( !user )
    {
      return res.status( 404 ).json( { message: 'Không tìm thấy thông tin người dùng' } );
    }

    const userEmail = user.email;

    // Kiểm tra xem đơn hàng có thể hủy hay không
    if ( orders.status == "Đã hoàn thành" || orders.status == "Đã hủy" )
    {
      return res.status( 400 ).json( { message: "Không thể thay đổi trạng thái đơn hàng này " } );
    }
    const transporter = nodemailer.createTransport( {
      service: 'gmail',
      auth: {
        user: 'thanhnvph26404@gmail.com', // Email của bạn
        pass: 'ricjggvzlskbtsxl', // Mật khẩu email của bạn
      },
    } );
    const mailOptions = {
      from: 'your_email@example.com', // Địa chỉ email của bạn
      to: userEmail, // Sử dụng thông tin email từ đơn hàng
      subject: 'Thông báo: Đơn hàng đã được hủy',
      text: 'Đơn hàng của bạn đã được hủy thành công. Chi tiết lý do: ' + cancelReason,
    };
    transporter.sendMail( mailOptions, function ( error, info )
    {
      if ( error )
      {
        console.error( 'Lỗi khi gửi email:', error );
      } else
      {
        console.log( 'Email thông báo đã được gửi: ' + info.response );
      }
    } );
    // Cập nhật lý do hủy và trạng thái
    orders.cancelReason = cancelReason;
    orders.status = "Đã hủy";
    console.log( cancelReason );

    // Thêm thông tin lý do hủy vào statusHistory
    orders.statusHistory.push( {
      status: "Đã hủy",
      updatedAt: Date.now(),
      updatedBy: _id, // ID của người thực hiện hành động hủy đơn hàng
    } );
    for ( const item of orders.products )
    {
      const product = await Product.findById( item.product._id );

      // Tìm biến thể sản phẩm dựa trên size và color trong item.productVariant
      const specificVariant = product.ProductVariants.find(
        ( variant ) => variant.size === item.productVariant.size && variant.color === item.productVariant.color
      );

      if ( specificVariant )
      {
        specificVariant.quantity += item.quantity; // Cập nhật lại số lượng biến thể sản phẩm
        await product.save(); // Lưu sản phẩm sau khi cập nhật
      }

      // Giảm số lượng sold của sản phẩm
      product.sold -= item.quantity;
      await product.save(); // Lưu sản phẩm sau khi giảm số lượng sold
    }
    // Lưu đơn hàng sau khi cập nhật
    await orders.save();

    return res.status( 200 ).json( { message: "Đã cập nhật trạng thái hủy đơn hàng" } );
  } catch ( error )
  {
    console.error( "Lỗi khi cập nhật đơn hàng:", error );
    return res.status( 500 ).json( { message: "Đã xảy ra lỗi khi cập nhật đơn hàng" } );
  }
}
export const getvoucher = async ( req, res ) =>
{
  const { _id } = req.user

  try
  {
    const getVoucher = await Auth.findById( _id ).populate( "vouchers" )
    res.json( getVoucher )
  } catch ( error )
  {
    return res.status( 500 ).json( { message: "Đã xảy ra lỗi khi cập nhậtvoucher" } );
  }
}


