import React from 'react'
import { toastSuccess, toastError } from "../../hook/toastify";
import { Form, Input } from 'antd';
import { Link, useNavigate } from "react-router-dom";

import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useLoginAdminMutation } from '../../store/Auth/Auth.services';
const LoginAdmin = () =>
{
    const navigate = useNavigate();
    const [ LoginAdmin ] = useLoginAdminMutation()
    const onFinish = async ( values: any ) =>
    {
        try
        {
            const response = await LoginAdmin( values ).unwrap();
            toastSuccess( "Đăng nhập thành công" );
            console.log( response );
            localStorage.setItem( "checktoken", response.checktoken );
            navigate( "/admin" );

        } catch ( error: any )
        {
            console.log( error );
            toastError( error.data.message );
        }

    }
    return (
        <div>
            <section className="bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="bg-gray-100 flex rounded-2xl shadow-lg max-w-3xl p-5 items-center">
                    <div className="md:w-1/2 px-16">
                        <h2 className="font-bold text-2xl text-black">Login Quản trị</h2>

                        <Form
                            name="basic"
                            className="mt-2"
                            layout="vertical"
                            onFinish={ onFinish }
                            autoComplete="off"
                        >


                            <Form.Item
                                name="email"
                                rules={ [
                                    { required: true, message: 'vui lòng nhập  email!' },
                                    { type: "email", message: "email không đúng định dạng" }
                                ] }
                            >
                                <Input prefix={ <MailOutlined /> } placeholder="Email" />
                            </Form.Item>


                            <Form.Item
                                name="password"
                                rules={ [
                                    { required: true, message: 'vui lòng nhập  password!' },
                                    { min: 6, message: "Password phải đủ 6 kí tự " }
                                ] }
                            >
                                <Input.Password prefix={ <LockOutlined /> } placeholder="Password" />
                            </Form.Item>



                            <Form.Item>
                                <button type="submit" className="bg-[#0F172A] rounded-2xl px-5 text-white py-2 hover:scale-105 duration-300">
                                    Login
                                </button>
                            </Form.Item>
                        </Form>



                    </div>
                    <div className="md:block hidden w-1/2">
                        <img className="rounded-2xl" src="./images/polotron.png" alt="" />
                    </div>
                </div>
            </section>
        </div>
    )
}

export default LoginAdmin