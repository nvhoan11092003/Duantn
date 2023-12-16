import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { IOrder, IUser, Login, Signup } from "./Auth.interface"
import { ICartData } from "../Cart/cartInterface";
import { Order, OrderItem } from "../Order/order";

import { IVoucher } from "../voucher/voucher.interface";
import { Iproductdata } from "../products/product.interface";
import { boolean } from "yup";
const authApi = createApi({
    reducerPath: "auth",
    tagTypes: ["Auth"],
    baseQuery: fetchBaseQuery({
        baseUrl: "https://databasedatn-8bp3hnthd-nvhoan11092003.vercel.app",

    }),
    endpoints: (builder) => ({
        signup: builder.mutation<Signup, Signup>({
            query: (auth) => ({
                url: `auth/register`,
                method: "POST",
                body: auth
            }), invalidatesTags: ["Auth"]
        }),
        login: builder.mutation<Login, Login>({
            query: (auth) => ({
                url: `auth/login`,
                method: "POST",
                body: auth
            }),
            invalidatesTags: ["Auth"]
        }),
        getUserList: builder.query({
            query: () => `auth/getAllUser`,
            providesTags: ['Auth']
        }),
        blockUser: builder.mutation<IUser[], string>({
            query(id) {
                // Lấy token từ localStorage
                const token = localStorage.getItem("token");
                return {
                    url: `/auth/block-user/${id}`,
                    method: 'PUT',
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                };
            },
            invalidatesTags: ['Auth'],
        }),

        unblockUser: builder.mutation<IUser[], string>({
            query(id) {
                // Lấy token từ localStorage
                const token = localStorage.getItem("token");
                return {
                    url: `/auth/unblock-user/${id}`,
                    method: 'PUT',
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                };
            },
            invalidatesTags: ['Auth'],
        }),

        forgotPasswordAuth: builder.mutation({
            query: (data: { email: string }) => ({
                url: `/password/forgot-password`,
                method: "POST",
                body: data,
            }),
        }),
        resetPasswordAuth: builder.mutation({
            query: (data: {
                password: string;
                randomCode: string;
                randomString: string | undefined;
            }) => {
                const forgotToken = localStorage.getItem("forgotToken");

                return {
                    url: `/password/reset-password`,
                    method: "POST",
                    body: data,
                    headers: {
                        Authorization: "Bearer " + forgotToken,
                    },
                };
            },
        }),
        changePasswordAuth: builder.mutation({
            query: (data: {
                oldPassword: string;
                password: string;
                confirmPassword: string;
            }) => {
                const checkToken = localStorage.getItem("tokenChange");

                return {
                    url: `/password/change-pass`,
                    method: "POST",
                    body: data,
                    headers: {
                        Authorization: "Bearer " + checkToken,
                    },
                };
            },
        }),
        sendCodeAuth: builder.mutation({
            query: (data: { email: string | undefined }) => {
                const token = localStorage.getItem("token")

                return {

                    url: 'password/send-code',
                    method: 'POST',
                    body: data, // Chuyển đối tượng data thành chuỗi JSON
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                }
            },
            invalidatesTags: ['Auth'],

        }
        ),

        checkCodeAuth: builder.mutation({
            query: (data: { code: string }) => {
                const checkToken = localStorage.getItem("tokenChange");

                return {
                    url: `password/check-code`,
                    method: "POST",
                    body: data,
                    headers: {
                        Authorization: "Bearer " + checkToken,
                    },
                };
            },
        }),
        getUserByToken: builder.mutation({
            query: (token: string | null) => ({
                url: `auth/get-user-token`,
                method: "POST",

                headers: {
                    Authorization: "Bearer " + token,
                },
            }),
            invalidatesTags: ["Auth"],
        }),
        editUserByToken: builder.mutation({
            query: (data: { address: string | null, Address: string, country: string }) => {
                const token = localStorage.getItem("token")

                return {
                    url: `auth/saveaddress`,
                    method: "PUT",
                    body: data,
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                }
            },
            invalidatesTags: ["Auth"],
        }),
        editUser: builder.mutation({
            query: (data: { name: string | null, phone: string | null, email: string | null }) => {
                // Lấy token từ localStorage
                const token = localStorage.getItem("token");
                return {
                    url: `/auth/updateUser`,
                    method: 'PUT',
                    body: data,
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                };
            },
            invalidatesTags: ['Auth'],
        }),
        editUserAdmin: builder.mutation<any[], any>({
            query: (user) => {
                console.log(user);

                // Lấy token từ localStorage
                const token = localStorage.getItem("token");
                return {
                    url: `/auth/updateUserAdmin/${user._id}`,
                    method: 'PUT',
                    body: user,
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                };
            },
            invalidatesTags: ['Auth'],
        }),
        getUser: builder.query({
            query: (_id: any) => {
                const token = localStorage.getItem("token");
                return {
                    url: `/auth/getOneUser/${_id}`,
                    method: 'GET',
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                }

            },
            providesTags: ["Auth"],
        }
        ),
        addToCart: builder.mutation({
            query: (data: { productId: string | null, size: string | null, color: string | null, quantity: number | null }) => {
                const token = localStorage.getItem("token");
                return {
                    url: `auth/add-to-cart`,
                    method: "POST",
                    body: data,
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                };
            },

            invalidatesTags: ["Auth"],
        }),
        getOrder: builder.query({
            query: () => {
                const token = localStorage.getItem("token");
                return {
                    url: `auth/getOrder`,
                    method: "GET",
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                }
            },
            providesTags: ["Auth"],
        }),
        getCart: builder.query({
            query: () => {
                const token = localStorage.getItem("token");
                return {
                    url: `auth/getCart`,
                    method: "GET",
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                }
            },
            providesTags: ["Auth"],
        }),
        getAllOrder: builder.query({
            query: () => {
                const token = localStorage.getItem("token");
                return {
                    url: `auth/getAllOrder`,
                    method: "GET",
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                };
            },

            providesTags: ["Auth"],
        }),
        updateOrderStatus: builder.mutation<IOrder, { id: string; status: string }>({
            query: ({ id, status }) => {
                const token = localStorage.getItem("token");
                return {
                    url: `auth/update-order/${id}`, // Thay đổi đường dẫn tùy thuộc vào API của bạn
                    method: 'PUT',
                    body: { status },
                    headers: {
                        Authorization: "Bearer " + token,
                    }
                }
            },

            invalidatesTags: ['Auth'], // Nếu có thay đổi, cập nhật lại dữ liệu
        }),
        createOrder: builder.mutation<Order, { COD: boolean, VNPAY: boolean, couponApplied: boolean, Address: string, country: string, address: string, phone: string, TTONL: boolean, shippingType: string, discountCode: string }>({
            query: ({ COD, couponApplied, Address, VNPAY, TTONL, shippingType, address, phone, discountCode, country }) => {
                const token = localStorage.getItem("token");

                let endpoint = 'auth/creatOrder'; // endpoint cần sửa đổi


                return {
                    url: endpoint,
                    method: 'POST',
                    body: { COD, couponApplied, Address, TTONL, shippingType, phone, address, VNPAY, discountCode, country },
                    headers: {
                        Authorization: "Bearer " + token,
                    }
                }
            },
            invalidatesTags: ['Auth'], // Nếu có thay đổi, cập nhật lại dữ liệu
        }),
        getVnpayreturn: builder.query({
            query: () => {
                const token = localStorage.getItem("token");
                return {
                    url: `auth/vnpay_return`,
                    method: "GET",
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                };
            },

            providesTags: ["Auth"],
        }),
        deleteoneProduct: builder.mutation<ICartData[], string>({
            query: (id) => {
                const token = localStorage.getItem("token");

                return {
                    url: `auth/removeOneCart/${id}`,
                    method: 'DELETE',
                    headers: {
                        Authorization: "Bearer " + token,
                    }
                }
            },

            invalidatesTags: ['Auth'], // Nếu có thay đổi, cập nhật lại dữ liệu
        }),
        applycoupon: builder.mutation<IVoucher, { voucher: string }>({
            query: (voucher) => {
                const token = localStorage.getItem("token");

                return {

                    url: 'auth/applycoupon',
                    method: 'POST',
                    body: voucher,
                    headers: {
                        Authorization: "Bearer " + token,
                    }
                }
            },
            invalidatesTags: ['Auth'], // Nếu có thay đổi, cập nhật lại dữ liệu

        }),
        getOneOrder: builder.query<Order, string>({
            query: (id) => {
                const token = localStorage.getItem("token");

                return {
                    url: `auth/getoneOrder/${id}`,
                    method: 'GET',
                    headers: {
                        Authorization: "Bearer " + token,
                    }
                }
            },
            providesTags: ['Auth']
        }),
        updateOrdersStatus: builder.mutation<IOrder, { id: string; status: string }>({
            query: ({ id, status }) => {
                const token = localStorage.getItem("token");
                return {
                    url: `auth/update-order/${id}`,
                    method: "PUT",
                    body: { status },
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                };
            },
            invalidatesTags: ["Auth"],
        }),

        confirmCancelOrder: builder.mutation<void, { id: string; isConfirmed: boolean }>({
            query: ({ id, isConfirmed }) => {
                const token = localStorage.getItem("token");
                return {
                    url: `auth/confirm-cancel-order/${id}`,
                    method: "PUT",
                    body: { isConfirmed },
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                };
            },
            invalidatesTags: ["Auth"],
        }),
        cancelOrder: builder.mutation<void, { id: string; reason: string }>({
            query: ({ id, reason }) => {
                const token = localStorage.getItem("token");
                return {
                    url: `auth/cancel-order/${id}`,
                    method: "POST",
                    body: { reason },
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                };
            },
            invalidatesTags: ["Auth"],
        }),
        increaseQuantity: builder.mutation<void, { itemId: any, increaseBy: any }>({
            query: ({ itemId, increaseBy }) => {
                const token = localStorage.getItem("token");
                return {
                    url: `/auth/increaseQuantity/${itemId}`,
                    method: "PUT",
                    body: { increaseBy },
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                }
            },
        }),
        decreaseQuantity: builder.mutation<void, { itemId: any, decreaseBy: any }>({
            query: ({ itemId, decreaseBy }) => {
                const token = localStorage.getItem("token");

                return {
                    url: `/auth/decreaseQuantity/${itemId}`,
                    method: "PUT",
                    body: { decreaseBy },
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                }
            },
        }),
        adddTowishList: builder.mutation<void, { prodId: string }>({
            query: (prodId) => {
                const token = localStorage.getItem("token")
                return {
                    url: "/auth/wishList",
                    method: "PUT",
                    body: { prodId },
                    headers: {
                        Authorization: "Bearer " + token,
                    }
                }
            },
            invalidatesTags: ["Auth"]
        }),
        getWishList: builder.query({
            query: () => {
                const token = localStorage.getItem("token")
                return {
                    url: "/auth/getWishlist",
                    headers: {
                        Authorization: "Bearer " + token,

                    }
                }
            }
        }),
        deleteoneWishList: builder.mutation<Iproductdata[], string>({
            query: (id) => {
                const token = localStorage.getItem("token");

                return {
                    url: `auth/removeWishList/${id}`,
                    method: 'DELETE',
                    headers: {
                        Authorization: "Bearer " + token,
                    }
                }
            },

            invalidatesTags: ['Auth'], // Nếu có thay đổi, cập nhật lại dữ liệu
        }),

        createPaymentUrl: builder.mutation<void, { amount: number, phone: number, address: string, Address: string, shippingType: string, country: string, couponApplied: boolean, discountCode: string }>({
            query: ({ amount, phone, address, Address, shippingType, couponApplied, discountCode, country }) => {
                const token = localStorage.getItem("token");

                return {
                    url: '/auth/create_payment_url',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: "Bearer " + token,
                    },
                    body: { amount, phone, address, Address, shippingType, couponApplied, discountCode, country },
                    // Thêm các thông tin khác vào body nếu cần
                }
            },
        }),
        chaneStatusOrder: builder.mutation({
            query: (idOrder: string) =>
            ({
                url: "auth/changeStatusPayment",
                body: idOrder
            })
        }),
        cancleOrders: builder.mutation<void, { id: string, cancelReason: string }>({
            query: ({ id, cancelReason }) => {
                const token = localStorage.getItem("token")
                return {
                    url: `/auth/cancelOrder/${id}`,
                    method: "PUT",
                    body: { cancelReason },
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                };
            },
            invalidatesTags: ["Auth"],
        }),
        saveVoucher: builder.mutation<void, { voucherId: string }>({
            query: (voucherId) => {
                const token = localStorage.getItem("token")
                return {
                    url: `/auth/saveVoucher`,
                    method: "PUT",
                    body: { voucherId },
                    headers: {
                        Authorization: "Bearer " + token,
                    },

                }
            },
            invalidatesTags: ["Auth"]
        }),
        getVoucher: builder.query({
            query: () => {
                const token = localStorage.getItem("token")
                return {
                    url: "/auth/getvouchers",
                    headers: {
                        Authorization: "Bearer " + token,

                    }
                }
            }
        }),
        getOrdersByStatus: builder.mutation({
            query: ({ status, startDates, endDates }) => {
                // Xử lý request query tại đây để gửi yêu cầu đúng đắn
                const body = { status, startDates, endDates };
                const token = localStorage.getItem("token")

                return {
                    url: '/auth/getStatusOrder', // Địa chỉ endpoint API của bạn
                    method: 'POST',
                    body,
                    headers: {
                        Authorization: "Bearer " + token,

                    }
                };
            },
        }),


        getphoneOrder: builder.mutation({
            query: ({ phone }) => {
                // Xử lý request query tại đây để gửi yêu cầu đúng đắn
                const body = { phone };
                const token = localStorage.getItem("token")

                return {
                    url: '/auth/getphoneOrder', // Địa chỉ endpoint API của bạn
                    method: 'POST',
                    body,
                    headers: {
                        Authorization: "Bearer " + token,

                    }
                };
            },
        }),
        getOrdersById: builder.mutation({
            query: ({ orderId }) => {
                // Xử lý request query tại đây để gửi yêu cầu đúng đắn
                const body = { orderId };
                const token = localStorage.getItem("token")

                return {
                    url: '/auth/getIdOrder', // Địa chỉ endpoint API của bạn
                    method: 'POST',
                    body,
                    headers: {
                        Authorization: "Bearer " + token,

                    }
                };
            },
        }),



    })
})
export const {
    useLoginMutation, useGetUserQuery, useEditUserAdminMutation, useGetOrdersByIdMutation, useGetphoneOrderMutation, useCancleOrdersMutation, useGetOrdersByStatusMutation, useGetVoucherQuery, useSaveVoucherMutation, useChaneStatusOrderMutation, useGetVnpayreturnQuery, useAddToCartMutation, useCreatePaymentUrlMutation, useDeleteoneWishListMutation, useAdddTowishListMutation, useGetWishListQuery, useDecreaseQuantityMutation, useIncreaseQuantityMutation, useCancelOrderMutation, useConfirmCancelOrderMutation, useUpdateOrdersStatusMutation, useGetOneOrderQuery, useApplycouponMutation, useDeleteoneProductMutation, useCreateOrderMutation, useGetCartQuery, useUpdateOrderStatusMutation, useGetAllOrderQuery, useGetOrderQuery, useEditUserMutation, useSignupMutation, useUnblockUserMutation, useGetUserByTokenMutation, useChangePasswordAuthMutation, useResetPasswordAuthMutation, useForgotPasswordAuthMutation, useGetUserListQuery, useBlockUserMutation, useSendCodeAuthMutation, useCheckCodeAuthMutation, useEditUserByTokenMutation
} = authApi
export const authReducer = authApi.reducer
export default authApi