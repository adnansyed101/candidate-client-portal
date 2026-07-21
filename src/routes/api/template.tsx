import { prisma } from '#/db'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/template')({
  server: {
    handlers: {
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
    },
  },
})
