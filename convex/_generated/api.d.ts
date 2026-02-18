/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as addresses from "../addresses.js";
import type * as cart from "../cart.js";
import type * as categories from "../categories.js";
import type * as clerk from "../clerk.js";
import type * as cloudinary from "../cloudinary.js";
import type * as cloudinaryImages from "../cloudinaryImages.js";
import type * as coupons from "../coupons.js";
import type * as debug_orders from "../debug_orders.js";
import type * as digitalFiles from "../digitalFiles.js";
import type * as heroSlides from "../heroSlides.js";
import type * as http from "../http.js";
import type * as orders from "../orders.js";
import type * as payments from "../payments.js";
import type * as presence from "../presence.js";
import type * as productVariants from "../productVariants.js";
import type * as products from "../products.js";
import type * as reviews from "../reviews.js";
import type * as shippingSettings from "../shippingSettings.js";
import type * as siteSettings from "../siteSettings.js";
import type * as stripe from "../stripe.js";
import type * as tax from "../tax.js";
import type * as uploadRawFile from "../uploadRawFile.js";
import type * as users from "../users.js";
import type * as wishlist from "../wishlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  addresses: typeof addresses;
  cart: typeof cart;
  categories: typeof categories;
  clerk: typeof clerk;
  cloudinary: typeof cloudinary;
  cloudinaryImages: typeof cloudinaryImages;
  coupons: typeof coupons;
  debug_orders: typeof debug_orders;
  digitalFiles: typeof digitalFiles;
  heroSlides: typeof heroSlides;
  http: typeof http;
  orders: typeof orders;
  payments: typeof payments;
  presence: typeof presence;
  productVariants: typeof productVariants;
  products: typeof products;
  reviews: typeof reviews;
  shippingSettings: typeof shippingSettings;
  siteSettings: typeof siteSettings;
  stripe: typeof stripe;
  tax: typeof tax;
  uploadRawFile: typeof uploadRawFile;
  users: typeof users;
  wishlist: typeof wishlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  cloudinary: {
    lib: {
      createPendingUpload: FunctionReference<
        "mutation",
        "internal",
        {
          filename?: string;
          folder?: string;
          metadata?: any;
          tags?: Array<string>;
          userId?: string;
        },
        { publicId: string; uploadId: string }
      >;
      deleteAsset: FunctionReference<
        "action",
        "internal",
        {
          config: { apiKey: string; apiSecret: string; cloudName: string };
          publicId: string;
        },
        { error?: string; success: boolean }
      >;
      deletePendingUpload: FunctionReference<
        "mutation",
        "internal",
        { uploadId: string },
        { error?: string; success: boolean }
      >;
      finalizeUpload: FunctionReference<
        "mutation",
        "internal",
        {
          folder?: string;
          publicId: string;
          uploadResult: {
            access_mode?: string;
            accessibility_analysis?: any;
            api_key?: string;
            asset_folder?: string;
            asset_id?: string;
            batch_id?: string;
            bytes?: number;
            colors?: Array<Array<any>>;
            context?: any;
            created_at?: string;
            delete_token?: string;
            display_name?: string;
            done?: boolean;
            eager?: Array<{
              bytes?: number;
              format?: string;
              height?: number;
              secure_url?: string;
              transformation?: string;
              url?: string;
              width?: number;
            }>;
            etag?: string;
            existing?: boolean;
            faces?: Array<Array<number>>;
            folder?: string;
            format: string;
            grayscale?: boolean;
            height?: number;
            illustration_score?: number;
            image_metadata?: any;
            media_metadata?: any;
            moderation?: Array<any>;
            original_extension?: string;
            original_filename?: string;
            pages?: number;
            phash?: string;
            placeholder?: boolean;
            public_id: string;
            quality_analysis?: { focus?: number };
            resource_type?: string;
            secure_url: string;
            semi_transparent?: boolean;
            signature?: string;
            status?: string;
            tags?: Array<string>;
            type?: string;
            url: string;
            version?: number;
            version_id?: string;
            width?: number;
          };
          userId?: string;
        },
        string
      >;
      generateUploadCredentials: FunctionReference<
        "action",
        "internal",
        {
          config: { apiKey: string; apiSecret: string; cloudName: string };
          filename?: string;
          folder?: string;
          publicId?: string;
          tags?: Array<string>;
          transformation?: {
            angle?: number | string;
            aspectRatio?: string | number;
            background?: string;
            border?: string;
            color?: string;
            crop?: string;
            defaultImage?: string;
            density?: number;
            dpr?: number | string;
            effect?: string;
            flags?: string | Array<string>;
            format?: string;
            gravity?: string;
            height?: number;
            namedTransformation?: string;
            opacity?: number;
            overlay?: string;
            page?: number;
            quality?: string | number;
            radius?: number | string;
            rawTransformation?: string;
            width?: number;
            x?: number;
            y?: number;
            zoom?: number;
          };
          userId?: string;
        },
        {
          uploadParams: {
            api_key: string;
            folder?: string;
            public_id?: string;
            signature: string;
            tags?: string;
            timestamp: string;
            transformation?: string;
          };
          uploadUrl: string;
        }
      >;
      getAsset: FunctionReference<
        "query",
        "internal",
        {
          config: { apiKey: string; apiSecret: string; cloudName: string };
          publicId: string;
        },
        {
          _creationTime: number;
          _id: string;
          bytes?: number;
          cloudinaryUrl: string;
          errorMessage?: string;
          folder?: string;
          format: string;
          height?: number;
          metadata?: any;
          originalFilename?: string;
          publicId: string;
          secureUrl: string;
          status: "pending" | "uploading" | "completed" | "failed";
          tags?: Array<string>;
          transformations?: Array<any>;
          updatedAt: number;
          uploadedAt: number;
          userId?: string;
          width?: number;
        } | null
      >;
      getUploadsByStatus: FunctionReference<
        "query",
        "internal",
        {
          limit?: number;
          status: "pending" | "uploading" | "completed" | "failed";
          userId?: string;
        },
        Array<{
          _creationTime: number;
          _id: string;
          bytes?: number;
          cloudinaryUrl: string;
          errorMessage?: string;
          folder?: string;
          format: string;
          height?: number;
          metadata?: any;
          originalFilename?: string;
          publicId: string;
          secureUrl: string;
          status: "pending" | "uploading" | "completed" | "failed";
          tags?: Array<string>;
          transformations?: Array<any>;
          updatedAt: number;
          uploadedAt: number;
          userId?: string;
          width?: number;
        }>
      >;
      listAssets: FunctionReference<
        "query",
        "internal",
        {
          config: { apiKey: string; apiSecret: string; cloudName: string };
          folder?: string;
          limit?: number;
          order?: "asc" | "desc";
          orderBy?: "uploadedAt" | "updatedAt";
          tags?: Array<string>;
          userId?: string;
        },
        Array<{
          _creationTime: number;
          _id: string;
          bytes?: number;
          cloudinaryUrl: string;
          errorMessage?: string;
          folder?: string;
          format: string;
          height?: number;
          metadata?: any;
          originalFilename?: string;
          publicId: string;
          secureUrl: string;
          status: "pending" | "uploading" | "completed" | "failed";
          tags?: Array<string>;
          transformations?: Array<any>;
          updatedAt: number;
          uploadedAt: number;
          userId?: string;
          width?: number;
        }>
      >;
      transform: FunctionReference<
        "query",
        "internal",
        {
          config: { apiKey: string; apiSecret: string; cloudName: string };
          publicId: string;
          transformation: {
            angle?: number | string;
            aspectRatio?: string | number;
            background?: string;
            border?: string;
            color?: string;
            crop?: string;
            defaultImage?: string;
            density?: number;
            dpr?: number | string;
            effect?: string;
            flags?: string | Array<string>;
            format?: string;
            gravity?: string;
            height?: number;
            namedTransformation?: string;
            opacity?: number;
            overlay?: string;
            page?: number;
            quality?: string | number;
            radius?: number | string;
            rawTransformation?: string;
            width?: number;
            x?: number;
            y?: number;
            zoom?: number;
          };
        },
        { secureUrl: string; transformedUrl: string }
      >;
      updateAsset: FunctionReference<
        "mutation",
        "internal",
        { metadata?: any; publicId: string; tags?: Array<string> },
        {
          _creationTime: number;
          _id: string;
          bytes?: number;
          cloudinaryUrl: string;
          errorMessage?: string;
          folder?: string;
          format: string;
          height?: number;
          metadata?: any;
          originalFilename?: string;
          publicId: string;
          secureUrl: string;
          status: "pending" | "uploading" | "completed" | "failed";
          tags?: Array<string>;
          transformations?: Array<any>;
          updatedAt: number;
          uploadedAt: number;
          userId?: string;
          width?: number;
        } | null
      >;
      updateUploadStatus: FunctionReference<
        "mutation",
        "internal",
        {
          bytes?: number;
          cloudinaryUrl?: string;
          errorMessage?: string;
          format?: string;
          height?: number;
          publicId?: string;
          secureUrl?: string;
          status: "pending" | "uploading" | "completed" | "failed";
          uploadId: string;
          width?: number;
        },
        {
          _creationTime: number;
          _id: string;
          bytes?: number;
          cloudinaryUrl: string;
          errorMessage?: string;
          folder?: string;
          format: string;
          height?: number;
          metadata?: any;
          originalFilename?: string;
          publicId: string;
          secureUrl: string;
          status: "pending" | "uploading" | "completed" | "failed";
          tags?: Array<string>;
          transformations?: Array<any>;
          updatedAt: number;
          uploadedAt: number;
          userId?: string;
          width?: number;
        } | null
      >;
      upload: FunctionReference<
        "action",
        "internal",
        {
          base64Data: string;
          config: { apiKey: string; apiSecret: string; cloudName: string };
          filename?: string;
          folder?: string;
          publicId?: string;
          tags?: Array<string>;
          transformation?: {
            angle?: number | string;
            aspectRatio?: string | number;
            background?: string;
            border?: string;
            color?: string;
            crop?: string;
            defaultImage?: string;
            density?: number;
            dpr?: number | string;
            effect?: string;
            flags?: string | Array<string>;
            format?: string;
            gravity?: string;
            height?: number;
            namedTransformation?: string;
            opacity?: number;
            overlay?: string;
            page?: number;
            quality?: string | number;
            radius?: number | string;
            rawTransformation?: string;
            width?: number;
            x?: number;
            y?: number;
            zoom?: number;
          };
          userId?: string;
        },
        {
          bytes?: number;
          error?: string;
          format?: string;
          height?: number;
          publicId?: string;
          secureUrl?: string;
          success: boolean;
          width?: number;
        }
      >;
    };
  };
  aggregate: {
    btree: {
      aggregateBetween: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any },
        { count: number; sum: number }
      >;
      aggregateBetweenBatch: FunctionReference<
        "query",
        "internal",
        { queries: Array<{ k1?: any; k2?: any; namespace?: any }> },
        Array<{ count: number; sum: number }>
      >;
      atNegativeOffset: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any; offset: number },
        { k: any; s: number; v: any }
      >;
      atOffset: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any; offset: number },
        { k: any; s: number; v: any }
      >;
      atOffsetBatch: FunctionReference<
        "query",
        "internal",
        {
          queries: Array<{
            k1?: any;
            k2?: any;
            namespace?: any;
            offset: number;
          }>;
        },
        Array<{ k: any; s: number; v: any }>
      >;
      get: FunctionReference<
        "query",
        "internal",
        { key: any; namespace?: any },
        null | { k: any; s: number; v: any }
      >;
      offset: FunctionReference<
        "query",
        "internal",
        { k1?: any; key: any; namespace?: any },
        number
      >;
      offsetUntil: FunctionReference<
        "query",
        "internal",
        { k2?: any; key: any; namespace?: any },
        number
      >;
      paginate: FunctionReference<
        "query",
        "internal",
        {
          cursor?: string;
          k1?: any;
          k2?: any;
          limit: number;
          namespace?: any;
          order: "asc" | "desc";
        },
        {
          cursor: string;
          isDone: boolean;
          page: Array<{ k: any; s: number; v: any }>;
        }
      >;
      paginateNamespaces: FunctionReference<
        "query",
        "internal",
        { cursor?: string; limit: number },
        { cursor: string; isDone: boolean; page: Array<any> }
      >;
      validate: FunctionReference<
        "query",
        "internal",
        { namespace?: any },
        any
      >;
    };
    inspect: {
      display: FunctionReference<"query", "internal", { namespace?: any }, any>;
      dump: FunctionReference<"query", "internal", { namespace?: any }, string>;
      inspectNode: FunctionReference<
        "query",
        "internal",
        { namespace?: any; node?: string },
        null
      >;
      listTreeNodes: FunctionReference<
        "query",
        "internal",
        { take?: number },
        Array<{
          _creationTime: number;
          _id: string;
          aggregate?: { count: number; sum: number };
          items: Array<{ k: any; s: number; v: any }>;
          subtrees: Array<string>;
        }>
      >;
      listTrees: FunctionReference<
        "query",
        "internal",
        { take?: number },
        Array<{
          _creationTime: number;
          _id: string;
          maxNodeSize: number;
          namespace?: any;
          root: string;
        }>
      >;
    };
    public: {
      clear: FunctionReference<
        "mutation",
        "internal",
        { maxNodeSize?: number; namespace?: any; rootLazy?: boolean },
        null
      >;
      delete_: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any },
        null
      >;
      deleteIfExists: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any },
        any
      >;
      init: FunctionReference<
        "mutation",
        "internal",
        { maxNodeSize?: number; namespace?: any; rootLazy?: boolean },
        null
      >;
      insert: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any; summand?: number; value: any },
        null
      >;
      makeRootLazy: FunctionReference<
        "mutation",
        "internal",
        { namespace?: any },
        null
      >;
      replace: FunctionReference<
        "mutation",
        "internal",
        {
          currentKey: any;
          namespace?: any;
          newKey: any;
          newNamespace?: any;
          summand?: number;
          value: any;
        },
        null
      >;
      replaceOrInsert: FunctionReference<
        "mutation",
        "internal",
        {
          currentKey: any;
          namespace?: any;
          newKey: any;
          newNamespace?: any;
          summand?: number;
          value: any;
        },
        any
      >;
    };
  };
  stripe: {
    private: {
      handleCheckoutSessionCompleted: FunctionReference<
        "mutation",
        "internal",
        {
          metadata?: any;
          mode: string;
          stripeCheckoutSessionId: string;
          stripeCustomerId?: string;
        },
        null
      >;
      handleCustomerCreated: FunctionReference<
        "mutation",
        "internal",
        {
          email?: string;
          metadata?: any;
          name?: string;
          stripeCustomerId: string;
        },
        null
      >;
      handleCustomerUpdated: FunctionReference<
        "mutation",
        "internal",
        {
          email?: string;
          metadata?: any;
          name?: string;
          stripeCustomerId: string;
        },
        null
      >;
      handleInvoiceCreated: FunctionReference<
        "mutation",
        "internal",
        {
          amountDue: number;
          amountPaid: number;
          created: number;
          status: string;
          stripeCustomerId: string;
          stripeInvoiceId: string;
          stripeSubscriptionId?: string;
        },
        null
      >;
      handleInvoicePaid: FunctionReference<
        "mutation",
        "internal",
        { amountPaid: number; stripeInvoiceId: string },
        null
      >;
      handleInvoicePaymentFailed: FunctionReference<
        "mutation",
        "internal",
        { stripeInvoiceId: string },
        null
      >;
      handlePaymentIntentSucceeded: FunctionReference<
        "mutation",
        "internal",
        {
          amount: number;
          created: number;
          currency: string;
          metadata?: any;
          status: string;
          stripeCustomerId?: string;
          stripePaymentIntentId: string;
        },
        null
      >;
      handleSubscriptionCreated: FunctionReference<
        "mutation",
        "internal",
        {
          cancelAt?: number;
          cancelAtPeriodEnd: boolean;
          currentPeriodEnd: number;
          metadata?: any;
          priceId: string;
          quantity?: number;
          status: string;
          stripeCustomerId: string;
          stripeSubscriptionId: string;
        },
        null
      >;
      handleSubscriptionDeleted: FunctionReference<
        "mutation",
        "internal",
        { stripeSubscriptionId: string },
        null
      >;
      handleSubscriptionUpdated: FunctionReference<
        "mutation",
        "internal",
        {
          cancelAt?: number;
          cancelAtPeriodEnd: boolean;
          currentPeriodEnd: number;
          metadata?: any;
          priceId?: string;
          quantity?: number;
          status: string;
          stripeSubscriptionId: string;
        },
        null
      >;
      updatePaymentCustomer: FunctionReference<
        "mutation",
        "internal",
        { stripeCustomerId: string; stripePaymentIntentId: string },
        null
      >;
      updateSubscriptionQuantityInternal: FunctionReference<
        "mutation",
        "internal",
        { quantity: number; stripeSubscriptionId: string },
        null
      >;
    };
    public: {
      createOrUpdateCustomer: FunctionReference<
        "mutation",
        "internal",
        {
          email?: string;
          metadata?: any;
          name?: string;
          stripeCustomerId: string;
        },
        string
      >;
      getCustomer: FunctionReference<
        "query",
        "internal",
        { stripeCustomerId: string },
        {
          email?: string;
          metadata?: any;
          name?: string;
          stripeCustomerId: string;
        } | null
      >;
      getPayment: FunctionReference<
        "query",
        "internal",
        { stripePaymentIntentId: string },
        {
          amount: number;
          created: number;
          currency: string;
          metadata?: any;
          orgId?: string;
          status: string;
          stripeCustomerId?: string;
          stripePaymentIntentId: string;
          userId?: string;
        } | null
      >;
      getSubscription: FunctionReference<
        "query",
        "internal",
        { stripeSubscriptionId: string },
        {
          cancelAt?: number;
          cancelAtPeriodEnd: boolean;
          currentPeriodEnd: number;
          metadata?: any;
          orgId?: string;
          priceId: string;
          quantity?: number;
          status: string;
          stripeCustomerId: string;
          stripeSubscriptionId: string;
          userId?: string;
        } | null
      >;
      getSubscriptionByOrgId: FunctionReference<
        "query",
        "internal",
        { orgId: string },
        {
          cancelAt?: number;
          cancelAtPeriodEnd: boolean;
          currentPeriodEnd: number;
          metadata?: any;
          orgId?: string;
          priceId: string;
          quantity?: number;
          status: string;
          stripeCustomerId: string;
          stripeSubscriptionId: string;
          userId?: string;
        } | null
      >;
      listInvoices: FunctionReference<
        "query",
        "internal",
        { stripeCustomerId: string },
        Array<{
          amountDue: number;
          amountPaid: number;
          created: number;
          orgId?: string;
          status: string;
          stripeCustomerId: string;
          stripeInvoiceId: string;
          stripeSubscriptionId?: string;
          userId?: string;
        }>
      >;
      listInvoicesByOrgId: FunctionReference<
        "query",
        "internal",
        { orgId: string },
        Array<{
          amountDue: number;
          amountPaid: number;
          created: number;
          orgId?: string;
          status: string;
          stripeCustomerId: string;
          stripeInvoiceId: string;
          stripeSubscriptionId?: string;
          userId?: string;
        }>
      >;
      listInvoicesByUserId: FunctionReference<
        "query",
        "internal",
        { userId: string },
        Array<{
          amountDue: number;
          amountPaid: number;
          created: number;
          orgId?: string;
          status: string;
          stripeCustomerId: string;
          stripeInvoiceId: string;
          stripeSubscriptionId?: string;
          userId?: string;
        }>
      >;
      listPayments: FunctionReference<
        "query",
        "internal",
        { stripeCustomerId: string },
        Array<{
          amount: number;
          created: number;
          currency: string;
          metadata?: any;
          orgId?: string;
          status: string;
          stripeCustomerId?: string;
          stripePaymentIntentId: string;
          userId?: string;
        }>
      >;
      listPaymentsByOrgId: FunctionReference<
        "query",
        "internal",
        { orgId: string },
        Array<{
          amount: number;
          created: number;
          currency: string;
          metadata?: any;
          orgId?: string;
          status: string;
          stripeCustomerId?: string;
          stripePaymentIntentId: string;
          userId?: string;
        }>
      >;
      listPaymentsByUserId: FunctionReference<
        "query",
        "internal",
        { userId: string },
        Array<{
          amount: number;
          created: number;
          currency: string;
          metadata?: any;
          orgId?: string;
          status: string;
          stripeCustomerId?: string;
          stripePaymentIntentId: string;
          userId?: string;
        }>
      >;
      listSubscriptions: FunctionReference<
        "query",
        "internal",
        { stripeCustomerId: string },
        Array<{
          cancelAt?: number;
          cancelAtPeriodEnd: boolean;
          currentPeriodEnd: number;
          metadata?: any;
          orgId?: string;
          priceId: string;
          quantity?: number;
          status: string;
          stripeCustomerId: string;
          stripeSubscriptionId: string;
          userId?: string;
        }>
      >;
      listSubscriptionsByUserId: FunctionReference<
        "query",
        "internal",
        { userId: string },
        Array<{
          cancelAt?: number;
          cancelAtPeriodEnd: boolean;
          currentPeriodEnd: number;
          metadata?: any;
          orgId?: string;
          priceId: string;
          quantity?: number;
          status: string;
          stripeCustomerId: string;
          stripeSubscriptionId: string;
          userId?: string;
        }>
      >;
      updateSubscriptionMetadata: FunctionReference<
        "mutation",
        "internal",
        {
          metadata: any;
          orgId?: string;
          stripeSubscriptionId: string;
          userId?: string;
        },
        null
      >;
      updateSubscriptionQuantity: FunctionReference<
        "action",
        "internal",
        { apiKey: string; quantity: number; stripeSubscriptionId: string },
        null
      >;
    };
  };
};
