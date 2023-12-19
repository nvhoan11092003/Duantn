import { useEffect, useState } from 'react';
import { useApplycouponMutation, useCreateOrderMutation, useCreatePaymentUrlMutation, useDeleteoneProductMutation, useGetCartQuery, useGetVoucherQuery } from '../../store/Auth/Auth.services';
import { toastError, toastSuccess } from '../../hook/toastify';
import Popup from 'reactjs-popup';

import
{
    PayPalScriptProvider,
    PayPalButtons,
    usePayPalScriptReducer
} from "@paypal/react-paypal-js";
import { Input, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useGetVoucherListQuery } from '../../store/voucher/voucher.service';


const CheckoutPage = () =>
{
    const navigate = useNavigate()
    const { data: cart } = useGetCartQuery( [] );
    const { data: getvoucher } = useGetVoucherQuery( null );

    const [ removeOnecart ] = useDeleteoneProductMutation()
    const remove = ( id: any ) =>
    {
        removeOnecart( id )
    }
    const { data: voucherss } = useGetVoucherListQuery( null )

    const [ createPaymentUrl ] = useCreatePaymentUrlMutation();
    const addresss = cart?.userId?.address
    const phonee = cart?.userId?.phone

    const Addresss = cart?.userId?.Address
    const countrys = cart?.userId?.country
    const hasPreviousDetails = addresss && phonee
    const [ address, setAddress ] = useState( hasPreviousDetails ? addresss : '' ); // State to store address
    const [ phone, setPhone ] = useState( hasPreviousDetails ? phonee : '' ); // State to store phone number
    const [ Address, setAddressS ] = useState( hasPreviousDetails ? Addresss : "" )
    const [ country, setcountry ] = useState( hasPreviousDetails ? countrys : "" )
    const [ couponApplied, setCouponApplied ] = useState( false );
    const [ createOrder ] = useCreateOrderMutation();
    const [ discountCode, setDiscountCode ] = useState( '' );
    const [ paymentMethod, setPaymentMethod ] = useState( '' );
    const [ shippingType, setShippingType ] = useState( '' );
    const [ shippingFee, setShippingFee ] = useState( 0 ); // Giá vận chuyển
    const [ voucher ] = useApplycouponMutation();
    const [ showPaypalButton, setShowPaypalButton ] = useState( false );
    const [ showVNPAYButton, setShowVNPAYButton ] = useState( false );
    const [ showCODButton, setShowCODButton ] = useState( false );
    const [ addressError, setAddressError ] = useState( '' );
    const [ phoneError, setPhoneError ] = useState( '' );
    const [ selectedVoucher, setSelectedVoucher ] = useState<any>( null );

    const handleVoucherClick = ( voucher: any ) =>
    {
        setSelectedVoucher( voucher ); // Set the selected voucher when clicked
    };

    const handleCloseModal = () =>
    {
        setSelectedVoucher( null ); // Reset selected voucher to close the modal
    };
    const validateAddress = () =>
    {
        if ( !address.trim() )
        {
            setAddressError( 'Vui lòng nhập địa chỉ.' );
            return false;
        }
        setAddressError( '' );
        return true;
    };

    // Validation function for the phone number
    const validatePhone = () =>
    {
        const phoneRegex = /^[0-9]{10}$/; // Adjust this regex based on your phone number format
        if ( !phone.match( phoneRegex ) )
        {
            setPhoneError( 'Vui lòng nhập số điện thoại hợp lệ.' );
            return false;
        }
        setPhoneError( '' );
        return true;
    };
    const style: {
        layout?: "vertical"
        // Các thuộc tính khác nếu có
    } = { layout: "vertical" };
    const ButtonWrapper = ( { quantity, amount, showSpinner, payload }: { quantity: string, amount: any, showSpinner: boolean, payload: any } ) =>
    {
        const [ { isPending, options }, dispatch ] = usePayPalScriptReducer();
        useEffect( () =>
        {
            dispatch( {
                type: "resetOptions",
                value: {
                    ...options,
                    currency: quantity
                }
            } );
        }, [ quantity, showSpinner ] );

        // Hàm xử lý khi nhấn thanh toán PayPal
        const handlePaypal = async () =>
        {
            if ( !cart?.items || cart.items.length === 0 )
            {
                toastError( "không có sản phẩm để checkout" )
                return
            }
            if ( !paymentMethod || !shippingType )
            {
                // Kiểm tra xem người dùng đã chọn phương thức thanh toán và vận chuyển chưa
                // Hiển thị thông báo lỗi hoặc ngăn chặn chuyển trang
                toastError( 'Vui lòng chọn phương thức thanh toán và vận chuyển.' );
                // Hiển thị thông báo lỗi
                return;
            }

            try
            {
                const paymentData: any = {
                    TTONL: paymentMethod === 'TTONL',
                    shippingType,
                    couponApplied,
                    payload,
                    phone,
                    address,
                    Address,
                    country,
                    discountCode: couponApplied ? discountCode : '', // Sử dụng mã giảm giá từ state nếu đã được áp dụng
                    // Other necessary information such as Address...
                };

                const calculatedTotalAmount = couponApplied ? cart?.totalAfterDiscount + shippingFee : cart?.total + shippingFee;

                const response = await createOrder( { ...paymentData, calculatedTotalAmount } );
                console.log( response );

                navigate( "/ordersuccess" )

            } catch ( error )
            {
                console.log( error );
            }
        };
        return (
            <>
                { ( showSpinner && isPending ) && <div className="spinner" /> }
                <PayPalButtons
                    style={ style }
                    disabled={ false }
                    forceReRender={ [ style, amount.currency ] }
                    fundingSource={ undefined }
                    createOrder={ ( data, actions ) =>
                        actions.order.create( {
                            purchase_units: [ { amount: { currency_code: quantity, value: amount } } ]
                        } ).then( userId => userId )
                    }
                    onApprove={ ( data, actions ) =>
                        actions.order?.capture().then( async ( response ) =>
                        {
                            if ( response?.status === "COMPLETED" )
                            {
                                handlePaypal();
                                console.log( "Order completed:", response );
                                console.log( payload );
                            } else
                            {
                                console.error( "Order not completed:", response );
                                // Xử lý khi capture không thành công ở đây
                            }
                        } ).then( () => undefined ) // Đảm bảo hàm onApprove trả về một Promise<void>
                    }
                />
            </>
        );
    }

    const Paypal = ( { amount, payload }: any ) =>
    {
        return (
            <div style={ { maxWidth: "750px", minHeight: "200px" } }>
                <PayPalScriptProvider options={ { clientId: "test", components: "buttons", currency: "USD" } }>
                    <ButtonWrapper payload={ payload } quantity={ "USD" } amount={ amount } showSpinner={ false } />
                </PayPalScriptProvider>
            </div>
        );
    }



    useEffect( () =>
    {
        if ( paymentMethod === 'TTONL' )
        {
            setShowPaypalButton( true );
        } else
        {
            setShowPaypalButton( false );
        }
    }, [ paymentMethod ] );

    const totalAmount = couponApplied ? cart?.totalAfterDiscount + shippingFee : cart?.total + shippingFee;
    const apppdiscoutn = cart?.totalAfterDiscount ? cart?.total - cart?.totalAfterDiscount : 0;

    const handlePaymentMethodChange = ( method: any ) =>
    {
        setPaymentMethod( method );
        if ( method === 'COD' )
        {
            setShowCODButton( true );
            setShowVNPAYButton( false );
            setShowPaypalButton( false );
        } else if ( method === 'VNPAY' )
        {
            setShowCODButton( false );
            setShowVNPAYButton( true );
            setShowPaypalButton( false );
        } else if ( method === 'TTONL' )
        {
            setShowCODButton( false );
            setShowVNPAYButton( false );
            setShowPaypalButton( true );
        }
    };


    const handleApplyCoupon = async () =>
    {
        if ( !cart?.items || cart.items.length === 0 )
        {
            toastError( "Không có sản phẩm để áp mã" );
            return;
        }


        if ( !voucherss )
        {
            toastError( "Không có mã giảm giá nào tồn tại" );
            return;
        }

        const foundVoucher = voucherss.data.find( ( voucher: any ) => voucher.code === discountCode );

        if ( !foundVoucher )
        {
            toastError( "Mã giảm giá không hợp lệ" );
            return;
        }

        if ( foundVoucher.limit <= 0 )
        {
            toastError( "Mã giảm giá đã hết hoặc không còn hiệu lực" );
            return;
        }
        const currentDate = new Date();
        const voucherEndDate = new Date( foundVoucher.endDate );
        const voucherStartDate = new Date( foundVoucher.startDate );

        // Check if current date is beyond voucher end date
        if ( currentDate > voucherEndDate )
        {
            toastError( "Mã giảm giá đã hết hạn" );
            return;
        }

        // Check if current date is before voucher start date
        if ( currentDate < voucherStartDate )
        {
            toastError( "Mã giảm giá chưa đến ngày áp dụng" );
            return;
        }
        // Apply coupon only if cart total is greater than or equal to the minimum order amount
        if ( cart.total < foundVoucher.minimumOrderAmount )
        {
            toastError( "Đơn hàng không đạt yêu cầu của mã giảm giá." );
            return;
        }
        if ( cart.total < foundVoucher.minimumOrderAmount )
        {
            toastError( "Đơn hàng không đạt yêu cầu của mã giảm giá." );
            return;
        }


        // Continue with applying the coupon
        await voucher( { voucher: discountCode } ).unwrap().then( response =>
        {
            console.log( response );

            toastSuccess( 'Áp mã thành công' );
            setCouponApplied( true );
        } ).catch( ( error ) =>
        {
            toastError( error.data.error );
        } );

    };

    const calculateTotalAmount = () =>
    {
        // Tính toán tổng số tiền sau khi chọn phương thức vận chuyển và áp dụng mã giảm giá
        let total = couponApplied ? cart?.totalAfterDiscount : cart?.total;
        total += shippingFee;
        return total

    };

    const handleCheckout = async () =>
    {
        if ( !cart?.items || cart.items.length === 0 )
        {
            toastError( "không có sản phẩm để checkout" )
            return
        }
        const isAddressValid = validateAddress();
        const isPhoneValid = validatePhone();
        if ( !isAddressValid || !isPhoneValid )
        {
            // If any field is invalid, prevent further action
            return;
        }
        if ( !paymentMethod && !shippingType )
        {
            toastError( 'Vui lòng chọn phương thức thanh toán và vận chuyển.' );
            // Hiển thị thông báo lỗi cần chọn cả hai
            return;
        } else if ( !paymentMethod )
        {
            toastError( 'Vui lòng chọn phương thức thanh toán.' );
            // Hiển thị thông báo lỗi cần chọn phương thức thanh toán
            return;
        } else if ( !shippingType )
        {
            toastError( 'Vui lòng chọn phương thức vận chuyển.' );
            // Hiển thị thông báo lỗi cần chọn phương thức vận chuyển
            return;
        }
        try
        {

            const paymentData: any = {
                COD: paymentMethod === 'COD',
                shippingType,
                couponApplied,
                phone,
                address,
                Address,
                country,
                discountCode: couponApplied ? discountCode : "", // Sử dụng mã giảm giá từ state nếu đã được áp dụng

            };
            console.log( paymentData );


            const calculatedTotalAmount = calculateTotalAmount()


            const response = await createOrder( { ...paymentData, calculatedTotalAmount } );
            navigate( "/ordersuccess" )

            console.log( 'Created order:', response );
            // Update UI or display success message...
        } catch ( error )
        {
            console.error( 'Error creating order:', error );
            // Display an error message to the user
        }
    };
    const redirectToVNPAY = ( url: any ) =>
    {
        window.location.href = url; // Chuyển hướng đến URL của VNPAY
    };


    const handlevnpayCheckout = async () =>
    {
        if ( !cart?.items || cart.items.length === 0 )
        {
            toastError( "không có sản phẩm để checkout" )
            return
        }
        const isAddressValid = validateAddress();
        const isPhoneValid = validatePhone();
        if ( !isAddressValid || !isPhoneValid )
        {
            // If any field is invalid, prevent further action
            return;
        }
        if ( !paymentMethod && !shippingType )
        {
            toastError( 'Vui lòng chọn phương thức thanh toán và vận chuyển.' );
            // Hiển thị thông báo lỗi cần chọn cả hai
            return;
        } else if ( !paymentMethod )
        {
            toastError( 'Vui lòng chọn phương thức thanh toán.' );
            // Hiển thị thông báo lỗi cần chọn phương thức thanh toán
            return;
        } else if ( !shippingType )
        {
            toastError( 'Vui lòng chọn phương thức vận chuyển.' );
            // Hiển thị thông báo lỗi cần chọn phương thức vận chuyển
            return;
        }

        try
        {
            const calculatedTotalAmount = calculateTotalAmount()

            const paymentData = {
                shippingType,
                couponApplied,
                phone,
                address,
                Address,
                country,
                amount: calculatedTotalAmount,
                discountCode: couponApplied ? discountCode : '',
            };

            createPaymentUrl( paymentData ).unwrap().then( ( response: any ) =>
            {
                redirectToVNPAY( response?.url );


            } ).catch( ( error ) =>
            {
                toastError( error.data.message )
            } )







        } catch ( error )
        {
            console.error( 'Error creating order:', error );
            // Display an error message to the user
        }
    };
    const handleShippingChange = ( e: any ) =>
    {
        try
        {
            const selectedShippingType = e.target.value;
            setShippingType( selectedShippingType );

            // Áp dụng giá vận chuyển tương ứng
            if ( selectedShippingType === 'nhanh' )
            {
                setShippingFee( 30000 ); // Giá vận chuyển cho giao hàng tiêu chuẩn
            } else if ( selectedShippingType === 'hỏa tốc' )
            {
                setShippingFee( 50000 ); // Giá vận chuyển cho giao hàng hỏa tốc
            }
        } catch ( error )
        {
            toastError( "bn ch chon phuong thuc van chuyen" )
        }

    };

    const startDateString = selectedVoucher?.startDate;
    const endDateString = selectedVoucher?.endDate;

    // Chuyển đổi ngày từ chuỗi sang đối tượng Date
    const startDate = new Date( startDateString );
    const endDate = new Date( endDateString );

    // Lấy thông tin ngày/tháng/năm không tính timezone
    const startDateWithoutTimezone = startDate.toLocaleDateString();
    const endDateWithoutTimezone = endDate.toLocaleDateString();


    const isVoucherValid = ( voucher: any ) =>
    {
        const currentDate = new Date();
        const endDate = new Date( voucher.endDate );

        // Check if the current date is beyond the endDate
        if ( currentDate > endDate )
        {
            return false;
        }

        // Check if the voucher has reached its limit
        if ( voucher?.limit !== 0 && voucher?.limit <= voucher?.orders?.length )
        {
            return false;
        }

        return true;
    };
    const handleUseVoucher = ( selectedVoucher: any ) =>
    {
        setSelectedVoucher( selectedVoucher );
        setDiscountCode( selectedVoucher?.code );
    };

    return (
        <div className="sm:flex max-sm:w-[360px] m-auto max-sm:mb-4" >
            <div className="sm:w-[50%]">
                <div className="sm:ml-[100px]">
                    <h1 className="text-3xl my-4 font-semibold max-sm:text-center">Giao hàng</h1>
                    <Select
                        className='sm:w-[566px] sm:h-[50px] max-sm:w-[360px]'
                        defaultValue="vietnam"
                        // style={{ width: 566, height: 50 }}
                        options={ [
                            { value: 'vietnam', label: 'Việt Nam' }
                        ] }
                    />
                    <div className="mt-5">
                        <Input className="w-[274px] h-[48px] max-sm:w-[360px] rounded-md border border-gray-400" type="email" value={ cart?.userId?.email } // Hiển thị email
                            placeholder="email" />
                        <Input className="w-[274px] max-sm:mt-3 max-sm:w-[360px] h-[48px] rounded-md border border-gray-400 sm:ml-4" value={ cart?.userId?.name } // Hiển thị email
                            type="text" placeholder="  Tên" />
                    </div>
                    <div className='mt-5'>
                        <Input

                            className="w-[564px] h-[48px] max-sm:w-[360px] rounded-md border border-gray-400 mt-5"
                            value={ address }
                            placeholder="Địa chỉ"
                            onChange={ ( e ) => setAddress( e.target.value ) }
                            onBlur={ validateAddress } // Trigger validation onBlur

                        />
                        { addressError && <span className=" px-2 text-red-500">{ addressError }</span> }

                    </div>

                    <div className="mt-5">
                        <Input

                            className="w-[274px] h-[48px] max-sm:w-[360px] rounded-md border border-gray-400"
                            type="text"
                            value={ Address }
                            placeholder="Huyện ,Phường ,Thị Xã"
                            onChange={ ( e ) => setAddressS( e.target.value ) } // Capture address input
                        />
                        <Input
                            value={ country }
                            className="w-[274px] h-[48px] max-sm:mt-3 max-sm:w-[360px] rounded-md border border-gray-400 sm:ml-4"
                            type="text"
                            placeholder="Địa chỉ số nhà làng xóm ngõ "
                            onChange={ ( e ) => setcountry( e.target.value ) }

                        />

                    </div>
                    <Input
                        className="w-[564px] h-[48px] max-sm:w-[360px] rounded-md border border-gray-400 mt-5"
                        type="text"
                        value={ phone }
                        onBlur={ validatePhone } // Trigger validation onBlur

                        placeholder="Điện thoại"
                        onChange={ ( e ) => setPhone( e.target.value ) } // Capture phone input
                    />
                    { phoneError && <span className=" px-2 text-red-500">{ phoneError }</span> }

                    <h2 className="mt-5 text-xl font-semibold">Phương thức vận chuyển</h2>
                    <label htmlFor='standardShipping' className={ `radio-button flex py-3 ` } >

                        <input
                            id='standardShipping'
                            type='radio'
                            name='shippingType'
                            checked={ shippingType === 'nhanh' }
                            readOnly
                            onChange={ handleShippingChange }

                            value='nhanh'
                        />
                        <div className="border rounded-md border-black  flex justify-between sm:w-[565px] h-[55px] items-center bg-[#F5F6FB] ">

                            <p className="ml-4 max-sm:w-[360px]">Giao hàng đồng giá</p>
                            <p className="mr-4 font-semibold">30.000đ</p>
                        </div>
                    </label>
                    {/* <label htmlFor='expressShipping' className={ `radio-button flex ` } >

                        <input
                            type="radio"
                            id="expressShipping"
                            name="shippingType"
                            value="hỏa tốc"
                            checked={ shippingType === 'hỏa tốc' }
                            onChange={ handleShippingChange }
                        />
                        <div className="border rounded-md border-black  flex justify-between sm:w-[565px] h-[55px] items-center bg-[#F5F6FB] ">

                            <p className="ml-4 max-sm:w-[360px]">Giao hàng hỏa tốc</p>
                            <p className="mr-4 font-semibold">50.000đ</p>
                        </div>
                    </label> */}
                    <h2 className="mt-5 text-xl font-semibold ">Thanh toán</h2>
                    <p className="text-gray-600">Toàn bộ các giao dịch được bảo mật và mã hóa.</p>
                    <div className='w-[40%]'>
                        <div className=''>
                            <div className='method-list '>
                                <label htmlFor='cod' className={ `radio-button flex py-3 ${ paymentMethod === 'COD' ? 'selected' : '' }` } onClick={ () => handlePaymentMethodChange( 'COD' ) }
                                >

                                    <input
                                        id='cod'
                                        type='radio'
                                        name='payment-method'
                                        checked={ paymentMethod === 'COD' }
                                        readOnly
                                        value='COD'
                                    />
                                    <span className='ml-3 my-auto'></span>
                                    <span className='label flex my-auto'>
                                        <div className='style-label flex align-center'>
                                            <img
                                                className='method-icon mr-[12px] w-[32px] h-[32px]'
                                                src='https://salt.tikicdn.com/ts/upload/92/b2/78/1b3b9cda5208b323eb9ec56b84c7eb87.png'
                                                alt='icon'
                                            />
                                            <div className='method-content'>
                                                <div className='w-[370px] mt-[10px]'>
                                                    <span>Thanh toán tiền mặt khi nhận hàng</span>
                                                </div>
                                            </div>
                                        </div>
                                    </span>
                                </label>
                                <label htmlFor='vnpay' className={ `radio-button flex py-3 ${ paymentMethod === 'VNPAY' ? 'selected' : '' }` } onClick={ () => handlePaymentMethodChange( 'VNPAY' ) }
                                >

                                    <input
                                        id='vnpay'
                                        type='radio'
                                        name='payment-method'
                                        checked={ paymentMethod === 'VNPAY' }
                                        readOnly
                                        value='VNPAY'
                                    />
                                    <span className='ml-3 my-auto'></span>
                                    <span className='label flex my-auto'>
                                        <div className='style-label flex align-center'>
                                            <img
                                                className='method-icon mr-[12px] w-[32px] h-[32px]'
                                                src='https://salt.tikicdn.com/ts/upload/92/b2/78/1b3b9cda5208b323eb9ec56b84c7eb87.png'
                                                alt='icon'
                                            />
                                            <div className='method-content'>
                                                <div className='w-[370px] mt-[10px]'>
                                                    <span>Thanh toán VNPay</span>
                                                </div>
                                            </div>
                                        </div>
                                    </span>
                                </label>
                                <label

                                    htmlFor='TTONL'
                                    className={ `radio-button flex py-3 ${ paymentMethod === 'TTONL' ? 'selected' : '' }` }
                                    onClick={ () => handlePaymentMethodChange( 'TTONL' ) }
                                >
                                    <input
                                        id='TTONL'
                                        type='radio'
                                        name='payment-method'
                                        readOnly
                                        value='TTONL'
                                    />
                                    <span className='ml-3 my-auto'></span>
                                    <span className='label flex my-auto'>
                                        <div className='style-label flex align-center'>
                                            <img
                                                className='method-icon mr-[12px] w-[32px] h-[32px]'
                                                src='https://tse1.mm.bing.net/th?id=OIP.wBKSzdf1HTUgx1Ax_EecKwHaHa&pid=Api&P=0&h=220'
                                                alt='icon'
                                            />
                                            <div className='method-content'>
                                                <div className='w-[370px] mt-[10px]'>
                                                    <span>Thanh toán bằng Paypal</span>
                                                </div>


                                            </div>
                                        </div>
                                    </span>
                                </label>
                                <div className='w-[566px] '>
                                    { showCODButton && (
                                        <button className="border bg-[#23314B] max-sm:w-[360px] text-white w-[566px] h-[55px] mt-5 rounded-md hover:bg-blue-500" onClick={ handleCheckout }>Thanh toán COD</button>
                                    ) }

                                    {/* Nút thanh toán cho phương thức VNPAY */ }
                                    { showVNPAYButton && (
                                        <button className="border bg-[#23314B] max-sm:w-[360px] text-white w-[566px] h-[55px] mt-5 rounded-md hover:bg-blue-500" onClick={ handlevnpayCheckout }>Thanh toán VNPAY</button>
                                    ) }

                                    {/* Nút thanh toán cho phương thức Paypal */ }
                                    { showPaypalButton && (
                                        <Paypal
                                            className="max-sm:w-[360px] w-[566px] h-[55px] mt-5"
                                            payload={ { items: cart?.items, total: totalAmount, totalAfterDiscount: cart?.totalAfterDiscount } }
                                            amount={ Math.round( totalAmount / 23500 ) }
                                        />
                                    ) }
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
            <div className="border-l-2 border-gray-200 sm:ml-4 pl-4 sm:w-[50%] bg-[#F5F5F5] ">
                <div className="mt-4">
                    { cart?.items?.map( ( item: any, index: any ) => (
                        <div key={ index } className="flex items-center p-2">
                            <img className="w-[60px] h-[80px] border rounded-md border-gray-300" src={ item.productInfo.images[ 0 ].url } alt="" />
                            <div className="ml-4 mr-4 w-[50%]">
                                <p>{ item.productInfo.name }</p>
                                <p>{ item.productVariant.size }</p>
                                <p>{ item.productVariant.color }</p>
                            </div>
                            <div className="w-1/4 sm:w-1/4 text-center ">
                                <div className="flex flex-col items-center">
                                    <p className="mb-2 border rounded-md border-gray-600 w-[48px] sm:w-[40px] h-[38px] sm:h-[32px] text-center pt-1">{ item.quantity }</p>
                                    <button className="underline hover:text-red-500" onClick={ () => remove( item.product._id ) }>Xóa</button>

                                </div>
                            </div>
                            <p className='max-sm:mr-2'>{ item.productInfo.price.toLocaleString() }₫</p>


                        </div>
                    ) ) }

                </div>
                <div className='max-sm:flex max-sm:items-center max-sm:mt-5 max-sm:justify-between'>


                    <Input
                        type="text"
                        placeholder="  Mã giảm giá"
                        value={ discountCode }
                        onChange={ ( e ) => setDiscountCode( e.target.value ) } // Capture the input value
                        className="rounded-md sm:mt-5 sm:w-[270px] h-[48px] border border-gray-200"
                    />

                    <button
                        onClick={ handleApplyCoupon }
                        className="border rounded-md border-gray-400 sm:ml-4 h-[48px] max-sm:mr-3 sm:w-[85px] bg-[#EDEDED]"
                    >
                        Áp dụng
                    </button>
                </div>

                <div className="mt-6 w-[72.5%] max-sm:m-auto max-sm:mt-6">
                    <div className="flex w-[1000px]">
                        <p>Tổng tiền </p>
                        <p className=' pl-[570px]'>{ cart?.total.toLocaleString() } đ</p>
                    </div>
                    <p>+</p>
                    <div className="flex w-[1000px]">
                        <p>Vận chuyển</p>
                        <p className=' pl-[555px]'>{ shippingFee.toLocaleString() } đ</p>
                    </div>
                    <hr className='w-[1000px]' />
                    <p>-</p>
                    <div className="flex w-[1000px]">
                        <p>Giảm giá</p>
                        <p className=' pl-[575px]'>{ apppdiscoutn.toLocaleString() } đ</p>
                    </div>
                    <div className="flex w-[1000px]">
                        <p className="font-mono text-[25px]">Tổng</p>
                        <p className="font-semibold pl-[585px] pt-[10px]">{ totalAmount.toLocaleString() } đ</p>
                    </div>

                    <div className='mt-[50px]'>
                        <div className="flex flex-col space-x-[20px]  mt-[20px] ml-[40px]">
                            <h2 className="font-semibold text-lg ml-2 mb-2">Voucher:</h2>
                            { getvoucher?.vouchers?.length === 0 ? (
                                <p>Bạn chưa có mã voucher nào.</p>
                            ) : (
                                <div className="flex flex-col space-y-4 ">
                                    { getvoucher?.vouchers?.map( ( voucher: any ) => (
                                        <div className='grid grid-cols-2 gap-[550px]'>
                                            <div>
                                                <button
                                                    onClick={ () => handleVoucherClick( voucher ) } // Handle the usage of the voucher
                                                    key={ voucher?._id }
                                                    className={ `bg-gray-200 space-x-6 rounded-full pl-[15px] text-[15px] font-medium flex w-[550px] ${ !isVoucherValid( voucher ) && 'opacity-50' }` }
                                                >
                                                    <p>{ voucher.name }</p>
                                                    <div> Mã code: { voucher.code } ({ voucher.discount }%)</div>
                                                    { !isVoucherValid( voucher ) && <p>Mã voucher hết hiệu lực</p> }
                                                </button>
                                            </div>

                                            <button className="border rounded-md border-gray-400 sm:ml-4 h-[48px] max-sm:mr-3 sm:w-[85px] bg-[#EDEDED]" onClick={ () => handleUseVoucher( voucher ) }>Sử dụng</button>
                                        </div>

                                    ) ) }
                                </div>
                            ) }
                        </div>
                        <Popup open={ selectedVoucher !== null } onClose={ handleCloseModal }>
                            {/* Content inside the Popup */ }
                            { selectedVoucher && (
                                <div className="modal">
                                        <button className="close pl-[20px] text-[40px]" onClick={ handleCloseModal }>&times;</button>
                                        <h2 className='text-[40px] text-center font-medium text-[#23314B]' >Thông Tin Mã Giảm Giá</h2>
                                    <div className="modal-content h-[400px] text-left pl-[60px] pt-[30px] ">
                                        <h2 className='text-[20px] font-medium text-[#23314B]'>Tên voucher : { selectedVoucher.name } </h2>
                                        <p className='text-[20px] font-medium text-[#23314B]'>Code: { selectedVoucher?.code }</p>
                                        <p className='text-[20px] font-medium text-[#23314B]'>Discount: { selectedVoucher?.discount }%</p>
                                        <p className='text-[20px] font-medium text-[#23314B]'>Điều kiện : { selectedVoucher?.detailVoucher }</p>
                                        <p className='text-[20px] font-medium text-[#23314B]'>Số lượng  : { selectedVoucher?.limit }</p>
                                        <p className='text-[20px] font-medium text-[#23314B]'> Ngày bắt đầu voucher : { startDateWithoutTimezone }</p>
                                        <p className='text-[20px] font-medium text-[#23314B]'> Ngày hết hạn voucher : { endDateWithoutTimezone }</p>
                                        {/* Add other voucher details you want to display */ }
                                    </div>
                                </div>
                            ) }
                        </Popup>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CheckoutPage