import { Button, Popconfirm, Select, Space, Table, message } from "antd";
import { useDeleteCommentMutation, useGetCommentListQuery } from "../../../store/Comment/comment.services";
import { useEffect, useState } from "react";
import { ColumnsType } from "antd/es/table";
import { useGetProductssQuery } from "../../../store/products/product.services";
import { Option } from "antd/es/mentions";
import { toastSuccess } from "../../../hook/toastify";

const Listcomment = () => {

    const { data: comments, refetch, isFetching } = useGetCommentListQuery()
    const { data: products } = useGetProductssQuery(null)


    const [data1, setdata1] = useState();
    const [product, setproduct] = useState('');
    const [start, setstart] = useState('');
    const [DeleteCommentMutation] = useDeleteCommentMutation()
    const removeComent = async (id: string) => {
        DeleteCommentMutation(id)
        await refetch()
        message.success("Xóa thành công Bình Luận")
    };
    interface IComment {
        _id: string,
        product: string
        name: string,
        comment: string,
        email: string,
        feedback: number,
        createdAt: string
    }
    useEffect(() => {
        if (comments) {
            const newcomments = comments.Comment.slice().reverse() // sắp xếp lại mảng
            const data: IComment[] = newcomments.filter((item: IComment) => {
                if (product !== "" && start !== "") {

                    if (item.product === product && item.feedback.toString() === start) {
                        return true
                    } else
                        return false
                }
                else if (product !== "") {
                    if (item.product === product) {
                        return true
                    } else
                        return false
                } else if (start !== "") {
                    if (item.feedback.toString() === start) {
                        return true
                    } else
                        return false
                }

                else return true


            });

            setdata1(data)
        }

    }, [isFetching, product, start])
    console.log(data1);




    const columns: ColumnsType<IComment> = [
        {
            title: "Tên hiển thị",
            dataIndex: "name",
            key: "name",
            render: (name) =>
            (
                <p className="text-xl line-clamp-2 overflow-hidden">{name} </p>
            )
        },
        {
            title: "Số sao",
            dataIndex: "feedback",
            key: "Số sao",
            render: (feedback) =>
            (
                <div className="flex items-center gap-x-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                        <p key={value} >
                            <i
                                className={`fa-solid fa-star ${value <= feedback ? 'text-yellow-500' : 'text-[#0A2139]'
                                    } text-center text-base`}
                            ></i>
                        </p>
                    ))}
                </div>
            )
        }, {
            title: "Thời Gian",
            dataIndex: "createdAt",
            key: "Thời Gian",
            render: (createdAt) =>
            (
                <div className="text-sm text-gray-66 flex flex-col">
                    <div className=""> {createdAt?.slice(0, 10)}</div>
                    <div className="">   {createdAt?.slice(11, 16)}</div>

                </div>
            )
        }, {
            title: "Nội dung",
            dataIndex: "comment",
            key: "Nội dung",
            render: (comment) =>
            (
                <div >
                    <p className="line-clamp-2 overflow-hidden"> {comment}</p>
                </div>
            )
        }, {
            title: "Hành động",
            dataIndex: "_id",
            key: "action",
            render: (_id) => (
                <Space size="middle">
                    <Popconfirm
                        title="Bạn muốn xóa bình luận "
                        onConfirm={() => removeComent(_id)}
                        okText="Yes"
                        okType="text"
                        cancelText="No"
                    >
                        <Button danger>Xoá</Button>
                    </Popconfirm>
                </Space>
            ),
        }


    ]

    const handleGetAllcomment = async () => {
        setstart("")
        setproduct("")
    };

    return (
        <div style={{ marginTop: 100, paddingRight: 50 }}>
            <h1 className="text-2xl mb-5">Quản Lý Bình Luận</h1>
            <div className="flex gap-4 items-center mb-4">
                <Select
                    placeholder="Chọn sản phẩm"

                    value={product}
                    onChange={(value) => setproduct(value)}
                    className="w-96"

                >
                    <Option className="w-full" value="">Tất cả sản phẩm</Option>
                    {products &&
                        products.products?.map((product: any) => (
                            <Option className="w-96 overflow-hidden" key={product._id} value={product._id}>
                                {product.name}
                            </Option>
                        ))}
                </Select>
                <Select
                    placeholder="Chọn số sao"
                    value={start}
                    onChange={(value) => setstart(value)}
                    style={{ width: 200 }}
                >
                    <Option value="">Tất cả Sao</Option>
                    {[1, 2, 3, 4, 5].map((value) => (
                        <Option key={value.toString()} value={value.toString()}>
                            {value}
                            <i
                                className={`pl-2 fa-solid fa-star text-yellow-500 text-center text-base`}
                            ></i>

                        </Option>
                    ))}
                </Select>
                <Button className="bg-blue-500" type="primary" onClick={handleGetAllcomment}>
                    Hiển thị tất cả bình luận
                </Button>

            </div>

            <Table
                className="bg-white"
                columns={columns}
                dataSource={data1}
                pagination={{ pageSize: 8 }}
            />
        </div>
    );
}

export default Listcomment
