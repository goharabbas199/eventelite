import { z } from 'zod';
import { 
  insertVendorSchema, 
  insertVendorProductSchema,
  insertVenueSchema,
  insertBookingOptionSchema,
  insertClientSchema,
  insertPlannedServiceSchema,
  insertExpenseSchema,
  vendors, vendorProducts, venues, bookingOptions, clients, plannedServices, expenses
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  vendors: {
    list: {
      method: 'GET' as const,
      path: '/api/vendors' as const,
      responses: {
        200: z.array(z.custom<typeof vendors.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/vendors' as const,
      input: insertVendorSchema,
      responses: {
        201: z.custom<typeof vendors.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/vendors/:id' as const,
      responses: {
        200: z.custom<typeof vendors.$inferSelect & { products: typeof vendorProducts.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/vendors/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  vendorProducts: {
    create: {
      method: 'POST' as const,
      path: '/api/vendors/:vendorId/products' as const,
      input: insertVendorProductSchema.omit({ vendorId: true }),
      responses: {
        201: z.custom<typeof vendorProducts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/products/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  },
  venues: {
    list: {
      method: 'GET' as const,
      path: '/api/venues' as const,
      responses: {
        200: z.array(z.custom<typeof venues.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/venues' as const,
      input: insertVenueSchema,
      responses: {
        201: z.custom<typeof venues.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/venues/:id' as const,
      responses: {
        200: z.custom<typeof venues.$inferSelect & { options: typeof bookingOptions.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/venues/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  bookingOptions: {
    create: {
      method: 'POST' as const,
      path: '/api/venues/:venueId/options' as const,
      input: insertBookingOptionSchema.omit({ venueId: true }),
      responses: {
        201: z.custom<typeof bookingOptions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/booking-options/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  },
  clients: {
    list: {
      method: 'GET' as const,
      path: '/api/clients' as const,
      responses: {
        200: z.array(z.custom<typeof clients.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/clients' as const,
      input: insertClientSchema,
      responses: {
        201: z.custom<typeof clients.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/clients/:id' as const,
      responses: {
        200: z.custom<typeof clients.$inferSelect & { services: typeof plannedServices.$inferSelect[], expenses: typeof expenses.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/clients/:id' as const,
      input: insertClientSchema.partial(),
      responses: {
        200: z.custom<typeof clients.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/clients/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  plannedServices: {
    create: {
      method: 'POST' as const,
      path: '/api/clients/:clientId/services' as const,
      input: insertPlannedServiceSchema.omit({ clientId: true }),
      responses: {
        201: z.custom<typeof plannedServices.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/services/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  },
  expenses: {
    list: {
      method: 'GET' as const,
      path: '/api/clients/:clientId/expenses' as const,
      responses: {
        200: z.array(z.custom<typeof expenses.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/clients/:clientId/expenses' as const,
      input: insertExpenseSchema.omit({ clientId: true }),
      responses: {
        201: z.custom<typeof expenses.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/expenses/:id' as const,
      input: insertExpenseSchema.partial().omit({ clientId: true }),
      responses: {
        200: z.custom<typeof expenses.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/expenses/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
