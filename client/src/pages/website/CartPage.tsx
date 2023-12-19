import { LockOutlined } from '@ant-design/icons'
import { useDecreaseQuantityMutation, useDeleteoneProductMutation, useGetCartQuery, useIncreaseQuantityMutation } from '../../store/Auth/Auth.services';

import { useAppDispatch } from '../../store/hook';
import { addOrder } from '../../store/Order/Order.slice';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toastError } from '../../hook/toastify';
import { RiUserLine } from 'react-icons/ri';



const CartPage = () =>
{
    const location = useLocation();
    const { data: cart, refetch } = useGetCartQuery( [] );
    console.log( cart );
    const [ hasOutOfStockProduct, setHasOutOfStockProduct ] = useState( false );
    console.log( hasOutOfStockProduct );
    const check = localStorage.getItem( 'token' ); // Lấy token từ Local Storage
    const [ increaseQuantity ] = useIncreaseQuantityMutation(); // Sử dụng mutation increaseQuantity
    const [ decreaseQuantity ] = useDecreaseQuantityMutation(); // Sử dụng mutation decreaseQuantity

    const [ removeOnecart ] = useDeleteoneProductMutation()
    const remove = ( id: any ) =>
    {
        removeOnecart( id )
    }

    useEffect( () =>
    {
        if ( cart && cart.items )
        {
            const hasOutOfStock = cart.items.some( ( item: any ) =>
            {
                const { productVariant } = item;
                const { size, color } = productVariant || {};
                const productVariantInfo = item.product?.ProductVariants?.find(
                    ( variant: any ) => variant.size === size && variant.color === color
                );
                return productVariantInfo && item.quantity > productVariantInfo.quantity;
            } );

            setHasOutOfStockProduct( hasOutOfStock );
        }
    }, [ cart ] );





    useEffect( () =>
    {
        const fetchData = async () =>
        {
            try
            {
                // Gọi hàm refetch để tải lại dữ liệu giỏ hàng
                await refetch();
                // Dữ liệu giỏ hàng đã được cập nhật
            } catch ( error: any )
            {
                toastError( error.data.error )   // Xử lý lỗi nếu có
            }
        };

        fetchData(); // Gọi hàm fetchData khi location.pathname thay đổi
    }, [ location.pathname, refetch ] );

    const handleIncreaseQuantity = async ( itemId: any, increaseBy: any ) =>
    {
        try
        {
            if ( cart && cart.items )
            {
                const currentItem = cart.items.find( ( item: any ) => item._id === itemId );
                if ( currentItem && currentItem.quantity >= 10 )
                {
                    toastError( "giới hạn mua sản phẩm " )
                    return;
                }
            }
            await increaseQuantity( { itemId, increaseBy } ).
                unwrap().then( ( response ) =>
                {
                    console.log( response );

                } )
                .catch( ( error ) =>
                {
                    toastError( error.data.message );
                } );

            await refetch(); // Gọi lại hàm refetch để cập nhật dữ liệu giỏ hàng
        } catch ( error )
        {
            // Xử lý lỗi nếu có
            toastError( "loi" );
        }
    };

    const handleDecreaseQuantity = async ( itemId: any, decreaseBy: any ) =>
    {
        try
        {
            // Nếu số lượng hiện tại đã là 0, không cho giảm xuống âm
            if ( cart && cart.items )
            {
                const currentItem = cart.items.find( ( item: any ) => item._id === itemId );
                if ( currentItem && currentItem.quantity <= 1 )
                {
                    return;
                }
            }

            await decreaseQuantity( { itemId, decreaseBy } );
            await refetch();
        } catch ( error: any )
        {
            toastError( error.data.error );
        }
    };
    return (
        <div className="p-4">
            <h1 className="text-center text-4xl sm:text-5xl py-4 font-semibold text-[#23314B]">Giỏ hàng</h1>
            <div className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-3/4 px-4 sm:px-8">
                    <div className="flex mt-5">
                        <p className="hidden sm:block w-3/4 font-mono text-xl">Sản phẩm</p>
                        <p className="hidden sm:block w-1/4 text-center font-mono text-xl">Số lượng</p>
                        <p className="hidden sm:block w-[267px] sm:w-1/4 text-center font-mono text-xl">Tổng</p>
                    </div>
                    <hr className='my-4' />
                    { check ? (
                        <div>
                            { cart && cart?.items?.map( ( item: any, index: any ) => (

                                <div className="flex py-4 sm:py-8 items-center" key={ index }>
                                    <div className="flex w-full items-center">
                                        { item?.product?.images && item?.productInfo?.images[ 0 ] && (
                                            <img
                                                className="w-[96px] h-[125px] sm:w-[80px] sm:h-[100px] mr-4"
                                                src={ item?.productInfo?.images[ 0 ]?.url }
                                                alt=""
                                            />
                                        ) }
                                        <div>
                                            <Link to={ `/home/product-detail/${ item.product._id }` }>{ item.productInfo.name } </Link>
                                            <p className="text-gray-400">{ item.productInfo?.price?.toLocaleString() }đ</p>
                                            <p className="text-gray-600 font-semibold">{ item.productVariant.size }</p>
                                            <p className="text-gray-600 font-semibold">{ item.productVariant.color }</p>

                                        </div>
                                    </div>
                                    <div className="w-1/4 sm:w-1/4 text-center mr-[55px]">
                                        <div className="flex flex-col items-center">
                                            <div className="border border-gray-300 rounded-md p-2 flex items-center">
                                                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={ () => handleDecreaseQuantity( item._id, 1 ) }>-</button>
                                                <p className="mb-2 mx-4 border rounded-md border-gray-600 w-[48px] sm:w-[40px] h-[38px] sm:h-[32px] text-center pt-1">{ item.quantity }</p>
                                                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={ () => handleIncreaseQuantity( item._id, 1 ) }>+</button>
                                            </div>
                                            <button className="underline hover:text-red-500" onClick={ () => remove( item.product._id ) }>Xóa</button>
                                        </div>
                                    </div>
                                    <div className="w-[267px] text-center mr-[15px] hidden sm:block">
                                        <p className="text-400">{ item.totalProduct }</p>
                                    </div>

                                    { item?.product?.ProductVariants?.map( ( variant: any ) => (
                                        item.productVariant.size === variant.size &&
                                        item.productVariant.color === variant.color &&
                                        item.quantity > ( variant?.quantity || 0 ) && (
                                            <p className='text-red-500' key={ variant.id }>Sản phẩm đã hết</p>
                                        )
                                    ) ) }
                                </div>

                            ) ) }
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-48">
                            <div className="text-center">
                                <p className="text-xl font-semibold mb-2">Bạn cần đăng nhập để xem giỏ hàng</p>
                                <Link to="/login">
                                    <button className="border rounded-full text-white px-4 py-2 bg-[#23314B]">Đăng nhập</button>
                                </Link>
                            </div>
                        </div>
                    ) }
                    <hr className='my-4' />


                </div>

                <div className="w-full sm:w-1/4 mt-4 sm:mt-0">
                    { check ? (
                        <div className="border border-gray-300 rounded-md px-4 py-6 sm:px-8 sm:py-9">

                            <div className="flex justify-between text-lg sm:text-xl text-[#23314B] py-4 font-semibold">
                                <p>Tổng cộng</p>
                                <p>{ cart?.total?.toLocaleString() } VND</p>
                            </div>
                            <p>Phí vận chuyển (nếu có) sẽ được tính toán trong trang thanh toán.</p>
                            <textarea placeholder="Ghi chú đơn hàng" className="w-[282px] sm:w-[220px] h-[115px] sm:h-[60px] border my-4 border-gray-300 rounded-md" name="" id="" />
                            { hasOutOfStockProduct ? (
                                <div>
                                    <p className=''>Có sản phẩm đã hết trong giỏ hàng. Vui lòng xóa để tiếp tục thanh toán.</p>
                                    {/* Có thể hiển thị thông báo hoặc hướng dẫn người dùng xóa sản phẩm */ }
                                </div>
                            ) : (
                                <Link to="/payment">
                                    <button
                                        className="border rounded-full text-white w-[282px] sm:w-[220px] h-[62px] sm:h-[60px] bg-[#23314B]"
                                        disabled={ !cart || !cart.items || cart.items.length === 0 }
                                    >
                                        <LockOutlined /> Thanh toán
                                    </button>
                                </Link>
                            ) }
                        </div>
                    ) : (
                        <div className="border border-gray-300 rounded-md px-4 py-6 sm:px-8 sm:py-9">

                            <div className="flex justify-between text-lg sm:text-xl text-[#23314B] py-4 font-semibold">
                                <p>Tổng cộng</p>
                                <p>0 VND</p>
                            </div>
                            <p>Phí vận chuyển (nếu có) sẽ được tính toán trong trang thanh toán.</p>
                            <textarea placeholder="Ghi chú đơn hàng" className="w-[282px] sm:w-[220px] h-[115px] sm:h-[60px] border my-4 border-gray-300 rounded-md" name="" id="" />
                            { hasOutOfStockProduct ? (
                                <div>
                                    <p>Có sản phẩm đã hết trong giỏ hàng. Vui lòng xóa để tiếp tục thanh toán.</p>
                                    {/* Có thể hiển thị thông báo hoặc hướng dẫn người dùng xóa sản phẩm */ }
                                </div>
                            ) : (
                                <Link to="/payment">
                                    <button
                                        className="border rounded-full text-white w-[282px] sm:w-[220px] h-[62px] sm:h-[60px] bg-[#23314B]"
                                        disabled={ !cart || !cart.items || cart.items.length === 0 }
                                    >
                                        <LockOutlined /> Thanh toán
                                    </button>
                                </Link>
                            ) }
                        </div>
                    ) }

                </div>
            </div>
        </div>
    );
}

export default CartPage;