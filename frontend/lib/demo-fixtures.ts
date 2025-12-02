/**
 * Demo fixtures loader for frontend-only demo mode.
 * 
 * This module provides pre-configured ProductState and ProductStatus
 * from demo_fixtures.json without requiring backend calls.
 * 
 * Enable with: NEXT_PUBLIC_DEMO_MODE=frontend
 */

import { ProductState, ProductStatus, ProductIteration, TrellisArtifacts } from "./product-types";

// Demo fixture data - embedded directly to avoid runtime file reads
// These values come from backend/demo_fixtures.json
const DEMO_FIXTURES = {
  product_create: {
    prompt: "Create a Lego Donkey Kong Labubu",
    model_url: "/demo_create.glb",  // Local file in public/
    preview_images: ["/labubudklego.jpeg"],
    no_background_images: [] as string[],
  },
  product_edit: {
    prompt: "Make it performative",
    model_url: "/demo_edit.glb",  // Local file in public/
    preview_images: ["/labubu_edit.jpeg"],
    no_background_images: [] as string[],
  },
};

// Simple stable IDs for demo mode caching - version suffix forces cache refresh
const DEMO_CREATE_ITERATION_ID = "demo_create_v2";
const DEMO_EDIT_ITERATION_ID = "demo_edit_v2";

/**
 * Get demo product state showing the "create" result.
 * Returns a fully-formed ProductState matching backend schema.
 */
export function getDemoProductState(): ProductState {
  const now = new Date().toISOString();
  const createFixture = DEMO_FIXTURES.product_create;
  
  const trellisOutput: TrellisArtifacts = {
    model_file: createFixture.model_url,
    no_background_images: createFixture.no_background_images,
  };
  
  const createIteration: ProductIteration = {
    id: DEMO_CREATE_ITERATION_ID,
    type: "create",
    prompt: createFixture.prompt,
    images: createFixture.preview_images,
    trellis_output: trellisOutput,
    created_at: now,
    note: "Demo fixture - pre-loaded for presentation",
  };
  
  return {
    prompt: createFixture.prompt,
    mode: "idle",
    status: "complete",
    message: "Demo product loaded",
    in_progress: false,
    image_count: createFixture.preview_images.length,
    images: createFixture.preview_images,
    trellis_output: trellisOutput,
    iterations: [createIteration],
    created_at: now,
    updated_at: now,
  };
}

/**
 * Get demo product status (for polling endpoint simulation).
 */
export function getDemoProductStatus(): ProductStatus {
  const createFixture = DEMO_FIXTURES.product_create;
  
  return {
    status: "complete",
    progress: 100,
    message: "Demo product ready",
    model_file: createFixture.model_url,
    preview_image: createFixture.preview_images[0],
    updated_at: new Date().toISOString(),
  };
}

/**
 * Get demo product state showing the "edit" result.
 * Includes both create and edit iterations for full history.
 */
export function getDemoProductStateAfterEdit(): ProductState {
  const now = new Date().toISOString();
  const createFixture = DEMO_FIXTURES.product_create;
  const editFixture = DEMO_FIXTURES.product_edit;
  
  const createTrellisOutput: TrellisArtifacts = {
    model_file: createFixture.model_url,
    no_background_images: createFixture.no_background_images,
  };
  
  const editTrellisOutput: TrellisArtifacts = {
    model_file: editFixture.model_url,
    no_background_images: editFixture.no_background_images,
  };
  
  const createIteration: ProductIteration = {
    id: DEMO_CREATE_ITERATION_ID,
    type: "create",
    prompt: createFixture.prompt,
    images: createFixture.preview_images,
    trellis_output: createTrellisOutput,
    created_at: now,
    note: "Demo fixture - pre-loaded for presentation",
  };
  
  const editIteration: ProductIteration = {
    id: DEMO_EDIT_ITERATION_ID,
    type: "edit",
    prompt: editFixture.prompt,
    images: editFixture.preview_images,
    trellis_output: editTrellisOutput,
    created_at: now,
    note: "Demo fixture - edit result",
  };
  
  return {
    prompt: createFixture.prompt,
    latest_instruction: editFixture.prompt,
    mode: "idle",
    status: "complete",
    message: "Demo product (edited) loaded",
    in_progress: false,
    image_count: editFixture.preview_images.length,
    images: editFixture.preview_images,
    trellis_output: editTrellisOutput,
    iterations: [createIteration, editIteration],
    created_at: now,
    updated_at: now,
  };
}

/**
 * Check if frontend demo mode is enabled.
 */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "frontend";
}

