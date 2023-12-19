import { Space, Table, Button, Popconfirm, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import { MdDelete } from "react-icons/md";
import { MdEdit } from "react-icons/md";
import { Select } from 'antd';

import { Link, useLocation } from "react-router-dom";
import { useDeleteProductMutation, useGetProductssQuery, useLocProductsQuery } from "../../../store/products/product.services";
import { Iproductdata } from "../../../store/products/product.interface";
import { EyeFilled } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { toastError, toastSuccess } from "../../../hook/toastify";
import { useGetCategoryListQuery } from "../../../store/categoies/category.services";
import { useGetBrandListQuery } from "../../../store/Brand/brand.services";
import { IoPencilSharp } from "react-icons/io5";
import { FaTrashCan } from "react-icons/fa6";


const { Option } = Select;


const ListProduct = () => {
    const location = useLocation()

    const [category, setCategory] = useState('');
    const [brand, setBrand] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState(''); // Giá tiền tối đa
    const [products, setProducts] = useState([]); // State lưu trữ sản phẩm
    const [sortedProducts, setSortedProducts] = useState<any>([]); // State để lưu trữ danh sách sản phẩm đã được sắp xếp
    const { data: product } = useGetProductssQuery(null)
    const { data: categorys } = useGetCategoryListQuery(null)
    const { data: brands } = useGetBrandListQuery(null)
    const { data, refetch } = useLocProductsQuery({
        category: category,
        brand: brand,
        minPrice: minPrice,
        maxPrice: maxPrice,

    });
    const sortProductsBySold = () => {
        const sortedBySold = [...product?.products]; // Tạo một bản sao của danh sách sản phẩm

        sortedBySold.sort((a, b) => b?.sold - a?.sold); // Sắp xếp danh sách sản phẩm theo số lượng bán giảm dần

        setSortedProducts(sortedBySold); // Lưu trữ danh sách sản phẩm đã được sắp xếp vào state
    };
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Gọi hàm refetch để tải lại dữ liệu giỏ hàng
                await refetch();
                // Dữ liệu giỏ hàng đã được cập nhật
            } catch (error: any) {
                toastError(error.data.error)   // Xử lý lỗi nếu có
            }
        };

        fetchData(); // Gọi hàm fetchData khi location.pathname thay đổi
    }, [location.pathname, refetch]);

    const handleGetAllProducts = async () => {
        try {
            await refetch(); // Lấy lại dữ liệu sản phẩm từ server
            setProducts(product?.products || []); // Hiển thị tất cả sản phẩm
            toastSuccess("Hiển thị tất cả sản phẩm");
        } catch (error) {
            console.error(error);
        }
    };
    const handleFilterByPrice = async () => {
        try {
            await refetch();
            const filteredProducts = data?.products || [];
            if (filteredProducts.length === 0) {
                toastError("Không có sản phẩm nào trong khoảng giá này.");
                setProducts([])
                return
            }
            setProducts(filteredProducts);
            setSortedProducts([])
            toastSuccess("Lọc sản phẩm thành công");
        } catch (error) {
            console.error(error);
        }
    };
    const [remove] = useDeleteProductMutation()
    const removeProduct = (id: string) => {
        remove(id)

    };

    const columns: ColumnsType<Iproductdata> = [
        {
            title: 'Ảnh sản phẩm',
            dataIndex: 'images',
            key: 'images',
            render: (images) => (
                <div className="">
                    <img src={images[0]?.url} alt={`Product Image`} style={{ width: 100 }} />
                </div>
            ),
        },
        {
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            key: 'name',
            render: (text) => (
                <p className="text-sm overflow-hidden whitespace-normal w-[90px] h-[100px]">{text}</p>
            ),
        },


        {
            title: 'Giá gốc',
            dataIndex: 'price',
            key: 'price',
            render: (number) => <p>{number?.toLocaleString()}đ</p>,
        },
        {
            title: 'Số lượng đã bán',
            dataIndex: 'sold',
            key: 'sold',
            render: (number) => <p>{number}</p>,
        },
        {
            title: 'Giá giảm',
            dataIndex: 'original_price',
            key: 'original_price',
            render: (number) => (
                <p>{number ? `${number.toLocaleString()}đ` : '0đ'}</p>
            ),
        },

        {
            title: 'Danh mục',
            dataIndex: 'category',
            key: 'category',
            render: (category) => <p>{category.title}</p>,
        },
        {
            title: 'Thương hiệu',
            dataIndex: 'brand',
            key: 'brand',
            render: (brand) => <p>{brand?.title}</p>,
        },
        {
            title: 'Đã cập nhật',
            dataIndex: 'updatedAt',
            key: 'update',

            render: (update) => {
                const dateObject = new Date(update);
                const formattedDate = dateObject.toLocaleDateString().slice(0, 10);


                return (
                    <div className="text-sm text-gray-66 flex flex-col" >
                        <div className="">{formattedDate}</div>
                    </div >
                );
            }
        },
        {
            title: 'Hành động',
            key: 'action',

            render: (record) => (
                <Space size="middle" className="w-10">
                    <Link to={`productDetailAdmin/${record._id}`}>
                        <EyeFilled className="text-[20px] pt-[5px]" />

                    </Link>
                    {/* <Popconfirm
                        title="Xóa tác vụ"
                        description="Bạn có chắc chắn muốn xóa tác vụ này không?"
                        onConfirm={ () => removeProduct( record._id ) }
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button danger>
                            <MdDelete />
                        </Button>
                    </Popconfirm>
                    <Button type="primary" className="bg-blue-500">
                        <Link to={ `/admin/product/${ record._id }` }>
                            <MdEdit />
                        </Link>
                    </Button> */}
                    <Link to={`/admin/product/${record._id}`}>
                        <IoPencilSharp className="text-lg text-gray-85 hover:text-[#1D1F2C]" />
                    </Link>

                    <Popconfirm
                        title="Xóa sản phẩm"
                        description="Bạn có chắc chắn muốn xóa sản phẩm này không?"
                        onConfirm={() => removeProduct(record._id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <FaTrashCan className="text-lg text-gray-85 hover:text-[#1D1F2C]" />
                    </Popconfirm>
                </Space>
            ),
        },
    ];



    return (
        <div className="mt-8 px-10">
            <Button type="primary" className="mb-4 bg-blue-500 ">
                <Link to="/admin/products/add">Thêm Sản Phẩm</Link>
            </Button>

            <div className="flex gap-4 items-center mb-4">
                <Input
                    type="number"
                    value={minPrice}
                    onChange={(e: any) => {
                        const enteredValue = e.target.value;
                        // Chỉ cho phép giá trị không âm
                        if (enteredValue >= 0 || enteredValue === '') {
                            setMinPrice(enteredValue);
                        }
                    }}
                    placeholder="Giá tối thiểu"
                    className="border border-gray-300 p-1 rounded"
                    style={{ width: 150 }}
                />
                <Input
                    type="number"
                    value={maxPrice}
                    onChange={(e: any) => {
                        const enteredValue = e.target.value;
                        // Chỉ cho phép giá trị không âm
                        if (enteredValue >= 0 || enteredValue === '') {
                            setMaxPrice(enteredValue);
                        }
                    }}
                    placeholder="Giá tối đa"
                    className="border border-gray-300 p-1 rounded"
                    style={{ width: 150 }}
                />

                <Select
                    placeholder="Chọn Category"
                    className="w-50"
                    value={category}
                    onChange={(value) => setCategory(value)}
                    style={{ width: 200 }}
                >
                    <Option value="">Tất cả Danh mục</Option>

                    {categorys &&
                        categorys?.data?.map((category: any) => (
                            <Option key={category._id} value={category.title}>
                                {category.title}
                            </Option>
                        ))}
                </Select>
                <Select
                    placeholder="Chọn Brand"
                    value={brand}
                    onChange={(value) => setBrand(value)}
                    style={{ width: 200 }}
                >
                    <Option value="">Tất cả Thương hiệu</Option>

                    {brands &&
                        brands?.brand?.map((brand: any) => (
                            <Option key={brand._id} value={brand.title}>
                                {brand.title}
                            </Option>
                        ))}
                </Select>
                <Button className="bg-blue-500" type="primary" onClick={handleFilterByPrice}>
                    Lọc sản phẩm
                </Button>
                <Button className="bg-blue-500" type="primary" onClick={handleGetAllProducts}>
                    Hiển thị tất cả sản phẩm
                </Button>
            </div>
            <Button
                className="bg-blue-500"
                type="primary"
                onClick={sortProductsBySold} // Gọi hàm sắp xếp khi click vào nút
            >
                Sắp xếp theo số lượng bán
            </Button>

            <Table
                style={{ backgroundColor: 'white' }}
                columns={columns}
                dataSource={sortedProducts.length > 0 ? sortedProducts : products.length > 0 ? products : product?.products || []}
                pagination={{ pageSize: 6 }}
            />
        </div>
    );
};

export default ListProduct;
