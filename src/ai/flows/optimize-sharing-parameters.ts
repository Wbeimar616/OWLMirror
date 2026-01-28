'use server';

/**
 * @fileOverview This file defines a Genkit flow for optimizing screen sharing parameters using AI.
 *
 * The flow adjusts compression settings in real-time based on network bandwidth and device
 * characteristics to ensure an optimal screen sharing experience.
 *
 * - `optimizeSharingParameters` - An exported function that calls the flow.
 * - `OptimizeSharingParametersInput` - The input type for the `optimizeSharingParameters` function.
 * - `OptimizeSharingParametersOutput` - The return type for the `optimizeSharingParameters` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeSharingParametersInputSchema = z.object({
  bandwidth: z.number().describe('Current network bandwidth in Mbps.'),
  deviceCharacteristics: z
    .string()
    .describe(
      'JSON string containing device characteristics such as CPU, RAM, and screen resolution.'
    ),
  currentCompression: z
    .number()
    .describe('The current compression level being used (0-100).'),
  currentFramerate: z
    .number()
    .describe('The current framerate being used.'),
});
export type OptimizeSharingParametersInput = z.infer<
  typeof OptimizeSharingParametersInputSchema
>;

const OptimizeSharingParametersOutputSchema = z.object({
  optimizedCompression: z
    .number()
    .describe('The suggested optimized compression level (0-100).'),
  optimizedFramerate: z
    .number()
    .describe('The suggested optimized framerate.'),
  reason: z
    .string()
    .describe(
      'The reason why the compression and framerate was adjusted, based on bandwidth and device characteristics.'
    ),
});
export type OptimizeSharingParametersOutput = z.infer<
  typeof OptimizeSharingParametersOutputSchema
>;

export async function optimizeSharingParameters(
  input: OptimizeSharingParametersInput
): Promise<OptimizeSharingParametersOutput> {
  return optimizeSharingParametersFlow(input);
}

const optimizeSharingParametersPrompt = ai.definePrompt({
  name: 'optimizeSharingParametersPrompt',
  input: {schema: OptimizeSharingParametersInputSchema},
  output: {schema: OptimizeSharingParametersOutputSchema},
  prompt: `You are an AI expert in optimizing screen sharing parameters.

  Based on the current network bandwidth ({{bandwidth}} Mbps), device characteristics ({{{deviceCharacteristics}}}), current compression level ({{currentCompression}}), and current framerate ({{currentFramerate}}), you should suggest optimized compression and framerate values to provide a smooth screen sharing experience.

  Explain the reasoning behind your suggested changes in the "reason" field.

  Consider that lower bandwidth and weaker devices require higher compression and/or lower framerate.
  Conversely, higher bandwidth and more powerful devices allow for lower compression and/or higher framerate.
`,
});

const optimizeSharingParametersFlow = ai.defineFlow(
  {
    name: 'optimizeSharingParametersFlow',
    inputSchema: OptimizeSharingParametersInputSchema,
    outputSchema: OptimizeSharingParametersOutputSchema,
  },
  async input => {
    const {output} = await optimizeSharingParametersPrompt(input);
    return output!;
  }
);
