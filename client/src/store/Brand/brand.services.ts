import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Brand } from './brand.interface'
import { log } from 'console'

export const brandApi = createApi({
    reducerPath: 'brandApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'https://databasedatn.vercel.app'
    }),
    tagTypes: ['Brand'],
    endpoints: (builder) => ({
        getBrandList: builder.query({
            query: () => ``,
            providesTags: ['Brand']
        }),
        getBrand: builder.query({
            query: (id: string) => {
                const token = localStorage.getItem("token")
                return {
                    url: `/${id}`,
                    method: 'GET',
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                }
            },
            providesTags: ['Brand']
        }),
        addBrand: builder.mutation<Brand[], Brand>({
            query: (brand) => {
                const token = localStorage.getItem("token")
                return {
                    url: ``,
                    method: 'POST',
                    body: brand,
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                }
            },
            invalidatesTags: ['Brand']
        }),
        editBrand: builder.mutation<Brand[], Brand>({
            query: (brand) => {
                const token = localStorage.getItem("token")
                return {
                    url: `/${brand._id}`,
                    method: 'PUT',
                    body: brand,
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                }
            },
            invalidatesTags: ['Brand']
        }),
        deleteBrand: builder.mutation<Brand[], string>({
            query: (id) => {
                const token = localStorage.getItem("token")
                return {
                    url: `/${id}`,
                    method: 'DELETE',
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                }
            },
            invalidatesTags: ['Brand'],
        })
    })

})

export const { useAddBrandMutation, useDeleteBrandMutation, useEditBrandMutation, useGetBrandListQuery, useGetBrandQuery } = brandApi