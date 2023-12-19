import { Button, Modal, Table } from "antd";
import { useLocation, useParams } from "react-router-dom";

import { InfoCircleTwoTone } from "@ant-design/icons";
import { useCancleOrdersMutation, useConfirmCancelOrderMutation, useGetOneOrderAdminQuery } from "../../../store/Auth/Auth.services";
import { useEffect, useState } from "react";
import { toastError, toastSuccess } from "../../../hook/toastify";
import TextArea from "antd/es/input/TextArea";

const OrderList = () =>
{
    const location = useLocation();
    const { id } = useParams<{ id: any }>()
    const { data: orderData, refetch } = useGetOneOrderAdminQuery( id )
    const [ cancelReasonModalVisible, setCancelReasonModalVisible ] = useState( false );
    const [ cancelReasonFromOrder, setCancelReasonFromOrder ] = useState( '' );
    const [ confirmCancelOrder ] = useConfirmCancelOrderMutation();
    const [ cancelReason, setCancelReason ] = useState( '' );
    const [ selectedOrderId, setSelectedOrderId ] = useState( null );
    const MIN_CANCEL_REASON_LENGTH = 10; // Minimum length for cancel reason

    const [ cancels ] = useCancleOrdersMutation()
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
    const handleCancelOrder = async () =>   
    {
        if ( cancelReason.trim().length === 0 )
        {
            toastError( 'Vui lòng nhập lý do hủy đơn hàng.' );
            return; // Stop the process if cancel reason is empty
        }

        if ( cancelReason.trim().length < MIN_CANCEL_REASON_LENGTH )
        {
            toastError( 'Lý do hủy quá ngắn. Vui lòng nhập ít nhất 10 ký tự.' );
            return; // Stop the process if cancel reason is too short
        }
        const cancel: any = {
            id: orderData?._id,
            cancelReason: cancelReason,
        };

        await cancels( cancel )
            .unwrap()
            .then( ( response ) =>
            {
                toastSuccess( 'Gửi yêu cầu thành công' );
                setSelectedOrderId( null );
                setCancelReason( '' );

            } ).catch( ( error: any ) =>
            {
                console.log( error );
                toastError( error.data.message );
            } );
    }

    const handleConfirmCancelOrder = async ( isConfirmed: boolean ) =>
    {
        localStorage.setItem( 'isConfirmed', JSON.stringify( isConfirmed ) );
        localStorage.setItem( 'cancelReasonFromOrder', JSON.stringify( cancelReasonFromOrder ) );


        try
        {
            const neworder: any = {
                id: orderData?._id, // Sử dụng ID của order
                isConfirmed: isConfirmed,
            }
            const response = await confirmCancelOrder( neworder )

            // Xử lý dữ liệu trả về từ API nếu cần

            // Sau khi xác nhận hủy đơn hàng thành công, ẩn Modal và làm những thứ cần thiết
            setCancelReasonModalVisible( false );
            setCancelReasonFromOrder( '' );

            // Thực hiện các bước cập nhật UI hoặc refetch dữ liệu nếu cần
            // Ví dụ: refetch dữ liệu order
            // refetchOrderData();
        } catch ( error )
        {
            console.error( 'Error confirming cancel order:', error );

        }
    };

    const handleShowCancelReasonModal = () =>
    {
        if ( orderData?.status === 'đang chờ được xử lý' )
        {
            setCancelReasonModalVisible( true );
            setCancelReasonFromOrder( orderData?.cancelReason || '' );
        }
    };

    const handleCancelReasonModalCancel = () =>
    {
        setCancelReasonModalVisible( false );
        setCancelReasonFromOrder( '' );
    };
    const [ productDataForTable, setProductDataForTable ] = useState<any[]>( [] );
    console.log( orderData );

    // Sử dụng useEffect để xử lý dữ liệu khi orderData thay đổi
    useEffect( () =>
    {
        if ( orderData && orderData?.products )
        {
            console.log( orderData ); // Check orderData structure
            console.log( orderData?.products ); // Check products array
            // Lấy thông tin từ productInfo và cập nhật state để hiển thị trong bảng
            const productsInfo = orderData?.products.map( ( product: any ) => ( {
                key: product._id,
                category: product.productInfo.category,
                name: product.productInfo.name,
                price: product.productInfo.price,
                quantity: product.quantity,
                images: product.productInfo.images,


                // Thêm các thông tin khác cần hiển thị từ productInfo
                // Ví dụ: category, images, brand, ...
            } ) );
            console.log( productsInfo ); // Check productsInfo before setting state
            setProductDataForTable( productsInfo );
            handleShowCancelReasonModal();

        }
    }, [ orderData ] );
    const statusHistoryData = orderData?.statusHistory.map( ( historyItem: any, index ) => ( {
        key: index,
        status: historyItem.status,
        updatedBy: {
            name: historyItem.updatedBy?.name || 'Unknown',
            role: historyItem.updatedBy?.role || 'User', // Ví dụ: lấy thông tin vai trò từ dữ liệu người dùng
        },
        updatedAt: new Date( historyItem?.updatedAt ).toLocaleString(), // Đổi định dạng ngày giờ
    } ) );



    const columns = [
        {
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Giá sản phẩm',
            dataIndex: 'price',
            key: 'price',
        },

        {
            title: 'Ảnh',
            dataIndex: 'images',
            key: 'images',
            render: ( images: any ) => (
                <div className="">
                    {/* {images.map((image: any, index: any) => ( */ }
                    <img src={ images[ 0 ]?.url } alt={ `Product Image` } style={ { width: 100 } } />
                    {/* // ))} */ }
                </div>
            ),
        },
        {
            title: 'Danh mục sản phẩm',
            dataIndex: 'category',
            key: "category",
            render: ( category: any ) => <p>{ category.title }</p>,
        },
        {
            title: 'Bình Luận',
            dataIndex: 'status',
            key: 'status',
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
        },

    ];

    return (
        <div>
            <h1 className="text-[27px] font-bold">Order</h1>
            {/* <div></div> */ }
            <div className="flex auto-cols-auto mt-[20px] space-x-[20px]">
                <div className="">
                    <h2 className="font-semibold text-[20px]">Product</h2>
                    <Table columns={ columns } dataSource={ productDataForTable } />
                    <div className="flex">
                        {/* dưới */ }
                        <div className="mt-[50px] bg-white w-[450px] h-[300px]">
                            <div className="ml-[20px] mt-[10px]">
                                <h2 className="font-bold text-[20px]  "><i className="fa-solid fa-location-dot text-[#286FFD]"></i> Địa chỉ giao hàng</h2>
                                <hr className="border-1 border-black w-[320px] mt-2" />
                            </div>
                            <div className="flex space-x-4 mt-4 ml-[20px]  ">
                                <i className="fa-solid fa-house text-[#ababab] pt-[3px] "></i>
                                <p className="text-gray-500 font-semibold">địa chỉ </p>
                            </div>
                            <div className=" mt-4 ml-[50px]">
                                <p className="text-[15px] text-black-500 font-bold" >NGÕ 230/69 mễ trì thượng nhà số 6 </p>
                            </div>
                            <div className="flex space-x-4 mt-4 ml-[20px]  ">
                                <i className="fa-solid fa-house text-[#ababab] pt-[3px] "></i>
                                <p className="text-gray-500 font-semibold">Địa chỉ thêm</p>
                            </div>
                            <div className=" mt-4 ml-[50px]">
                                <p className="text-[15px] text-black-500 font-bold" >Phường mễ trì </p>
                            </div>


                        </div>


                        {/* dưới */ }
                        <div className="mt-[50px] bg-white w-[465px] h-[300px]">





                            <div className="ml-[20px] mt-[10px]">
                                <h2 className="font-bold text-[20px]  "><i className="fa-solid fa-location-dot text-[#286FFD]"></i> Địa chỉ thanh toán</h2>
                                <hr className="border-1 border-black w-[320px] mt-2" />
                            </div>
                            <div className="flex space-x-4 mt-4 ml-[20px]  ">
                                <i className="fa-solid fa-house text-[#ababab] pt-[3px] "></i>
                                <p className="text-gray-500 font-semibold">Thành phố </p>
                            </div>
                            <div className=" mt-4 ml-[50px]">
                                <p className="text-[15px] text-black-500 font-bold" >{ orderData?.userId?.address }</p>
                            </div>
                            <div className="flex space-x-4 mt-4 ml-[20px]  ">
                                <i className="fa-solid fa-house text-[#ababab] pt-[3px] "></i>
                                <p className="text-gray-500 font-semibold">Quận huyện </p>
                            </div>
                            <div className=" mt-4 ml-[50px]">
                                <p className="text-[15px] text-black-500 font-bold" >{ orderData?.Address }</p>
                            </div>
                            <div className="flex space-x-4 mt-4 ml-[20px]  ">
                                <i className="fa-solid fa-house text-[#ababab] pt-[3px] "></i>
                                <p className="text-gray-500 font-semibold">làng ngõ xóm </p>
                            </div>
                            <div className=" mt-4 ml-[50px]">
                                <p className="text-[15px] text-black-500 font-bold" >{ orderData?.country }</p>
                            </div>
                        </div>

                    </div>
                    <div className="mt-[50px] bg-white p-4 rounded shadow-md">
                        <h2 className="font-bold text-[20px] mb-4">
                            <i className="fa-solid fa-truck text-[#286FFD]"></i> Lịch sử trạng thái đơn hàng
                            <hr className="border-1 border-black w-[320px] mt-2" />

                        </h2>

                        <div className="mb-4 border-b border-gray-300 pb-2">

                            { statusHistoryData?.map( ( historyItem ) => (
                                <div key={ historyItem.key }>
                                    <p className="text-gray-500 mb-1">{ historyItem.status }</p>
                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">Được cập nhật bởi:</span> { historyItem.updatedBy.name }
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">Vai trò:</span> { historyItem.updatedBy.role }
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">Ngày giờ cập nhật:</span> { historyItem.updatedAt }
                                    </p>
                                    <hr className="border-1 border-black w-[320px] mt-2" />
                                </div>
                            ) ) }
                            { orderData?.cancelReason ? (
                                <p className="text-sm text-gray-700">
                                    <span className="font-semibold">lý do Hủy :</span> { orderData?.cancelReason }
                                </p>
                            ) : (
                                ""
                            ) }

                        </div>


                    </div>
                </div>
                <div className="mt-[10px] bg-white w-[350px] h-[380px]">
                    <div className="ml-[20px] mt-[10px]">
                        <h2 className="font-bold text-[20px] "><InfoCircleTwoTone /> Người đặt hàng</h2>
                        <hr className="border-1 border-black w-[280px] mt-2" />
                    </div>
                    <div className="flex space-x-4 mt-4 ml-[20px]">
                        <i className="fa-solid fa-cart-shopping text-[#ababab] pt-[3px] "></i>
                        <p className="text-gray-500 font-semibold">Order Status</p>
                    </div>
                    <div className=" mt-4 ml-[50px]">
                        <p className="text-[15px] text-gray-500" >{ orderData?.status }</p>
                        <Button type="primary" danger onClick={ () => setCancelReasonModalVisible( true ) }>Hủy đơn hàng</Button>
                        <Modal
                            title="Lý do hủy đơn hàng"
                            visible={ cancelReasonModalVisible }
                            onCancel={ handleCancelReasonModalCancel }

                            footer={ [
                                <Button key='confirm' type='primary' onClick={ handleCancelOrder }>
                                    Xác nhận
                                </Button>,

                            ] }
                        >
                            <TextArea
                                value={ cancelReason }
                                onChange={ ( e ) => setCancelReason( e.target.value ) }
                                placeholder="Nhập lý do hủy đơn hàng"
                            />
                        </Modal>
                    </div>
                    { orderData?.status === 'đang chờ được xử lý' && (
                        <Modal
                            title="Lý do hủy hàng"
                            visible={ cancelReasonModalVisible }
                            onCancel={ handleCancelReasonModalCancel }
                            footer={ [
                                <Button key='confirm' type='primary' onClick={ () => handleConfirmCancelOrder( true ) }>
                                    Xác nhận
                                </Button>,
                                <Button key='cancel' onClick={ () => handleConfirmCancelOrder( false ) }>
                                    Hủy
                                </Button>,
                            ] }
                        >
                            <p>Lý do hủy hàng: { cancelReasonFromOrder }</p>
                        </Modal>
                    ) }
                    <div>
                        <div className="flex space-x-4 mt-4 ml-[20px]">
                            <i className="fa-solid fa-user text-[#ababab] pt-[3px] "></i>
                            <p className="text-gray-500 font-semibold">Tên người đặt</p>
                        </div>
                        <div className=" mt-4 ml-[50px]">
                            <p className="text-[15px] text-gray-500" >{ orderData?.userId?.name }</p>
                        </div>
                        <div className="flex space-x-4 mt-4 ml-[20px]  ">

                            <i className="fa-solid fa-envelope text-[#ababab] pt-[3px] "></i>
                            <p className="text-gray-500 font-semibold">Email</p>

                            <i className="fa-solid fa-copy text-[#ababab] pt-[3px] pl-[200px] "></i>

                        </div>
                        <div className=" mt-4 ml-[50px]">
                            <p className="text-[15px] text-gray-500" >{ orderData?.userId?.email }</p>
                        </div>
                        <div className="flex space-x-4 mt-4 ml-[20px]  ">

                            <i className="fa-solid fa-mobile text-[#ababab] pt-[3px] "></i>
                            <p className="text-gray-500 font-semibold">Số điện thoại</p>

                            <i className="fa-solid fa-copy text-[#ababab] pt-[3px] pl-[155px] "></i>

                        </div>
                        <div className=" mt-4 ml-[50px]">
                            <p className="text-[15px] text-black-500 font-bold" >{ orderData?.userId?.phone }</p>
                        </div>
                    </div>
                    {/* dưới */ }
                    <div className="mt-[50px] bg-white w-[320px] h-[200px]">
                        <div className="ml-[20px] mt-[10px]">
                            <h2 className="font-bold text-[20px] "><i className="fa-solid fa-money-bill text-[#286FFD]"></i> Payment</h2>
                            <hr className="border-1 border-black w-[280px] mt-2" />
                        </div>
                        <div className="flex space-x-4 mt-4 ml-[20px]  ">
                            <i className="fa-solid fa-file-lines text-[#ababab] pt-[3px] "></i>
                            <p className="text-gray-500 font-semibold">ID</p>
                            <i className="fa-solid fa-copy text-[#ababab] pt-[3px] pl-[220px] "></i>
                        </div>
                        <div className=" mt-4 ml-[50px]">
                            <p className="text-[15px] text-black-500 font-bold" >{ orderData?.paymentIntent?.id }</p>
                        </div>
                        <div className="flex space-x-4 mt-4 ml-[20px]">
                            <i className="fa-solid fa-credit-card text-[#ababab] pt-[3px] "></i>
                            <p className="text-gray-500 font-semibold">Phương thức thanh toán</p>
                        </div>
                        <div className=" mt-4 ml-[50px]">
                            <p className="text-[15px] text-black-500 font-bold" >{ orderData?.paymentStatus }</p>
                        </div>

                    </div>

                    {/* dưới */ }
                    <div className="mt-[50px] bg-white w-[330px] h-[380px]">
                        <div className="ml-[20px] mt-[10px]">
                            <h2 className="font-bold text-[20px] "><i className="fa-solid fa-truck text-[#286FFD]"></i> { orderData?.status }</h2>
                            <hr className="border-1 border-black w-[280px] mt-2" />
                        </div>

                        <div className="flex space-x-4 mt-4 ml-[20px]">
                            <i className="fa-solid fa-truck text-[#ababab] pt-[3px] "></i>
                            <p className="text-gray-500 font-semibold">Phương thức vận chuyển</p>
                        </div>
                        <div className=" mt-4 ml-[50px]">
                            <p className="text-[15px] text-black-500 font-bold" >{ orderData?.shippingType }</p>
                        </div>

                    </div>
                </div>



            </div>
        </div>
    )

}

export default OrderList