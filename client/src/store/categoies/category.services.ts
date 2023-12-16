import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { ICategory } from './category.interface'

export const categoryApi = createApi({
    reducerPath: 'categoryApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'https://databasedatn.vercel.app'
    }),
    tagTypes: ['Category'],
    endpoints: (builder) => ({
        getCategoryList: builder.query({
            query: () => ``,
            providesTags: ['Category']
        }),
        getCategory: builder.query({
            query: (id: string) => ({
                url: `/${id}`,
                method: 'GET',
            }),
            providesTags: ['Category']
        }),
        addCategory: builder.mutation<ICategory[], ICategory>({
            query: (category) => ({
                url: ``,
                method: 'POST',
                body: category
            }),
            invalidatesTags: ['Category']
        }),
        editCategory: builder.mutation<ICategory[], ICategory>({
            query: (category) => ({
                url: `/${category._id}`,
                method: 'PATCH',
                body: category
            }),
            invalidatesTags: ['Category']
        }),
        deleteCategory: builder.mutation<ICategory[], string>({
            query: (id) => ({
                url: `/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Category'],
        }),
        getCategoryProduct: builder.query({
            query: (id: string) => {
                console.log(id);
                return {
                    url: `/getproduct/${id}`,
                    method: "GET"
                }
            },
            providesTags: ['Category']
        })
    })

})

export const { useAddCategoryMutation, useGetCategoryListQuery, useGetCategoryProductQuery, useDeleteCategoryMutation, useEditCategoryMutation, useGetCategoryQuery } = categoryApi