import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Image } from './upload.interface'
export const uploadImagesApi = createApi({
    reducerPath: 'uploadImagesApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'https://databasedatn-8bp3hnthd-nvhoan11092003.vercel.app/'
    }),
    tagTypes: ['upload'],
    endpoints: (builder) => ({
        uploadImages: builder.mutation({
            query: (formData) => ({
                url: 'images/uploads',
                method: 'POST',
                body: formData
            }),
            invalidatesTags: ['upload']
        }),
        uploadImage: builder.mutation({
            query: (formData) => ({
                url: 'images/upload',
                method: 'POST',
                body: formData
            }),
            invalidatesTags: ['upload']
        }),
        updateImage: builder.mutation<Image, { publicId: string, formData: FormData }>({
            query: ({ publicId, formData }) => ({
                url: `images/upload/${publicId}`,
                method: 'PUT',
                body: formData
            }),
            invalidatesTags: ['upload']
        }),
    })
})

export const { useUploadImagesMutation, useUploadImageMutation, useUpdateImageMutation } = uploadImagesApi