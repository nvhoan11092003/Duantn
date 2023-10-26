import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { IProductVariant } from './productVariant.interface'

export const productVariantApi = createApi({
    reducerPath: 'productVariantApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'http://localhost:8080/productVariant'
    }),
    tagTypes: ['productVariant'],
    endpoints: (builder) => ({

        editproductVariant: builder.mutation<IProductVariant[], IProductVariant>({
            query: (productVariant) => ({
                url: `/${productVariant._id}`,
                method: 'PATCH',
                body: productVariant
            }),
            invalidatesTags: ['productVariant']
        }),
        deleteproductVariant: builder.mutation<IProductVariant[], string>({
            query: (id) => ({
                url: `/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['productVariant'],
        })
    })

})

export const { useDeleteproductVariantMutation, useEditproductVariantMutation, } = productVariantApi