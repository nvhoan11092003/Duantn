import express, { Router } from "express"

import { authMiddlware, isAdmin } from "../middleware/checkPermission"
import { BlockUser, getAllUser, getOneUser, getUserByToken, logIn, register, removeUser, editAddressToken, unBlockUser, updateUser, verify, addToCart, emptyCart, updateOrderStatus, createOrder, applyCoupon, getOrders, getAllOrders, getUserCart, removeFromCart, getoneOrders, cancelOrderRequest, confirmCancelOrder, getCancelledOrders, getCancelledtrueOrders, increaseQuantity, decreaseQuantity } from "../controllers/auth"

const router = express.Router()
router.post( '/register', register )
router.post( '/login', logIn )
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
router.delete( "/emptyCart", authMiddlware, emptyCart )
router.put( "/update-order/:id", authMiddlware, updateOrderStatus )
router.post( "/creatOrder", authMiddlware, createOrder )
router.get( "/getOrder", authMiddlware, getOrders )
router.get( "/getoneOrder/:id", authMiddlware, getoneOrders )
router.get( "/getcancletrueOrder", authMiddlware, getCancelledOrders )
router.get( "/getcanclefalseOrder", authMiddlware, getCancelledtrueOrders )


router.get( "/getAllOrder", authMiddlware, getAllOrders )
router.get( "/getCart", authMiddlware, getUserCart );
router.delete( "/removeOneCart/:id", authMiddlware, removeFromCart )
router.post( '/cancel-order/:id', authMiddlware, cancelOrderRequest );
router.put( '/confirm-cancel-order/:id', authMiddlware, confirmCancelOrder );
router.post( "/applycoupon", authMiddlware, applyCoupon )
router.put( '/increaseQuantity/:id', authMiddlware, increaseQuantity );

// Route để giảm số lượng sản phẩm trong giỏ hàng
router.put( '/decreaseQuantity/:id', authMiddlware, decreaseQuantity );






export default router