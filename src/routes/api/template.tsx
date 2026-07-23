import { prisma } from '#/db'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/template')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const templates = await prisma.job.findMany({
            include: {
              formFields: true,
              candidates: true,
            },
          })
          return Response.json({
            success: true,
            data: templates,
            message: 'Templates fetched successfully.',
          })
        } catch (error: any) {
          // Handle database or other unexpected errors

          return Response.json(
            {
              success: false,
              error: 'Internal server error in creating template.',
              message: error.message,
            },
            { status: 400 },
          )
        }
      },
      POST: async ({ request }) => {
        const body = await request.json()

        try {
          const newJob = await prisma.job.create({
            data: {
              title: body.title,
              formFields: {
                create: body.formFields,
              },
            },
          })

          return Response.json({
            success: true,
            data: newJob,
            message: 'New Template created successfully.',
          })
        } catch (error: any) {
          // Handle database or other unexpected errors
          return Response.json(
            {
              success: false,
              error: 'Internal server error in creating template.',
              message: error.message,
            },
            { status: 400 },
          )
        }
      },
      PATCH: async ({ request }) => {
        const body = await request.json()

        try {
          const updatedJob = await prisma.job.update({
            where: { id: body.id },
            data: {
              title: body.title,
              formFields: {
                deleteMany: {},
                create: body.formFields,
              },
            },
            include: {
              formFields: true,
            },
          })

          return Response.json({
            success: true,
            data: updatedJob,
            message: 'Template updated successfully.',
          })
        } catch (error: any) {
          return Response.json(
            {
              success: false,
              error: 'Internal server error in updating template.',
              message: error.message,
            },
            { status: 400 },
          )
        }
      },
      DELETE: async ({ request }) => {
        const url = new URL(request.url)
        const id = url.searchParams.get('id')

        if (!id) {
          return Response.json(
            { success: false, message: 'Template ID is required.' },
            { status: 400 },
          )
        }

        try {
          await prisma.candidate.deleteMany({ where: { jobId: id } })
          await prisma.job.delete({ where: { id } })

          return Response.json({
            success: true,
            message: 'Template deleted successfully.',
          })
        } catch (error: any) {
          return Response.json(
            {
              success: false,
              error: 'Internal server error in deleting template.',
              message: error.message,
            },
            { status: 400 },
          )
        }
      },
    },
  },
})
