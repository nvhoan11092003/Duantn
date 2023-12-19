
import express, { Router } from "express"
import { authMiddlware, isAdmin } from "../middleware/checkPermission"
import { BlockUser, getAllUser, getOneUser, getUserByToken, logIn, register, removeUser, editAddressToken, unBlockUser, updateUser, verify, addToCart, emptyCart, updateOrderStatus, createOrder, applyCoupon, getOrders, getAllOrders, getUserCart, removeFromCart, getoneOrders, cancelOrderRequest, confirmCancelOrder, getCancelledOrders, getCancelledtrueOrders, increaseQuantity, decreaseQuantity, getWishList, removeWishList, cancleOrder, createPaymentUrl, vnpayReturn, getvoucher, findOrderByid, findOrderByPhone, updateUserAdmin, updateOrderStatusUser, getoneOrdersAdmin, logInAdmin } from "../controllers/auth"
import { addTowishList, locproduct } from "../controllers/products"
import { saveVoucherToUser } from "../controllers/voucher"

const router = express.Router()
router.post( '/register', register )
router.post( '/login', logIn )
router.post( '/loginAdmin', logInAdmin )

router.post( '/add-to-cart', authMiddlware, addToCart );
router.post( '/verify', verify )
router.put( '/block-user/:id', authMiddlware, isAdmin, BlockUser )
router.put( '/unblock-user/:id', authMiddlware, isAdmin, unBlockUser )
router.put( '/saveaddress', authMiddlware, editAddressToken )
router.get( '/getAllUser', getAllUser )
router.get( '/getOneUser/:id', authMiddlware, isAdmin, getOneUser )
router.delete( '/removeUser/:id', removeUser )
router.post( "/get-user-token", authMiddlware, getUserByToken )
router.put( '/updateUser', authMiddlware, updateUser )
router.put( '/updateUserAdmin/:id', authMiddlware, updateUserAdmin )
router.delete( "/emptyCart", authMiddlware, emptyCart )
router.put( "/update-order/:id", authMiddlware, updateOrderStatus )
router.put( "/update-orderuser/:id", authMiddlware, updateOrderStatusUser )

router.post( "/creatOrder", authMiddlware, createOrder )
router.get( "/getOrder", authMiddlware, getOrders )
router.get( "/getoneOrder/:id", authMiddlware, getoneOrders )
router.get( "/getoneOrderadmin/:id", authMiddlware, getoneOrdersAdmin )

router.get( "/getcancletrueOrder", authMiddlware, getCancelledOrders )
router.post( "/getStatusOrder", authMiddlware, getCancelledtrueOrders )
router.post( "/getIdOrder", authMiddlware, findOrderByid )
router.post( "/getphoneOrder", authMiddlware, findOrderByPhone )

router.delete( "/removeWishList/:id", authMiddlware, removeWishList )
router.get( "/getAllOrder", authMiddlware, getAllOrders )
router.get( "/getCart", authMiddlware, getUserCart );
router.delete( "/removeOneCart/:id", authMiddlware, removeFromCart )
router.post( '/cancel-order/:id', authMiddlware, cancelOrderRequest );
router.put( '/confirm-cancel-order/:id', authMiddlware, confirmCancelOrder );
router.post( "/applycoupon", authMiddlware, applyCoupon )
router.put( '/increaseQuantity/:id', authMiddlware, increaseQuantity );
router.get( "/getWishlist", authMiddlware, getWishList )
router.put( "/wishList", authMiddlware, addTowishList )
router.put( '/decreaseQuantity/:id', authMiddlware, decreaseQuantity );
router.put( "/cancelOrder/:id", authMiddlware, cancleOrder )
router.post( '/create_payment_url', authMiddlware, createPaymentUrl )
router.get( '/vnpay_return', vnpayReturn )
// router.post( '/changeStatusPayment', changeStatusPayment )
router.put( "/saveVoucher", authMiddlware, saveVoucherToUser )
router.get( "/getvouchers", authMiddlware, getvoucher )
router.get( "/product", locproduct )






export default router