import { z } from "zod";
import { optionalText } from "./form-errors";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address."),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  province: z.string().trim().optional(),
  message: z
    .string()
    .trim()
    .min(5, "Write a message of at least 5 characters."),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address."),
  password: z
    .string()
    .min(1, "Enter your password.")
    .min(6, "Password must be at least 6 characters."),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter the contact name."),
  email: z
    .string()
    .trim()
    .min(1, "Enter a business email.")
    .email("Enter a valid email address."),
  password: z
    .string()
    .min(1, "Enter a password.")
    .min(8, "Password must be at least 8 characters."),
  company: z.string().trim().min(2, "Enter the store or company name."),
  phone: z.string().trim().optional(),
  province: z.string().trim().min(2, "Choose a province."),
  address: z.string().trim().optional(),
  licenceNumber: z
    .string()
    .trim()
    .min(3, "Enter the tobacco licence number."),
});

export const orderSchema = z.object({
  province: z.string().trim().min(2, "Choose a province."),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Choose a product."),
        quantity: z
          .number("Enter a whole number of packs.")
          .int("Enter a whole number of packs.")
          .min(1, "Quantity must be at least 1.")
          .max(500, "Quantity cannot be more than 500 packs."),
      })
    )
    .min(1, "Add at least one product."),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Enter a product name."),
  shortName: optionalText(2, "Short name must be at least 2 characters."),
  slug: optionalText(2, "Slug must be at least 2 characters."),
  tagline: z.string().trim().min(2, "Enter a tagline."),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters."),
  flavour: optionalText(2, "Flavour must be at least 2 characters."),
  nicotinePerPortionMg: z
    .number("Enter nicotine per portion as a number.")
    .nonnegative("Nicotine per portion cannot be negative."),
  nicotinePerGramMg: z
    .number("Enter nicotine per gram as a number.")
    .nonnegative("Nicotine per gram cannot be negative."),
  pouchesPerPack: z.string().optional(),
  packSize: z.string().optional(),
  format: z.string().optional(),
  origin: z.string().optional(),
  active: z.boolean().optional(),
  image: z.string().optional(),
  overviewImage: z.string().optional(),
});
