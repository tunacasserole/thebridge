/**
 * Response Optimization Module
 *
 * Provides comprehensive response optimization including:
 * - Length control and max_tokens optimization
 * - Response templates and structured outputs
 * - Response compression and summarization
 */

export {
  // Length Controller
  type ResponseProfile,
  type QueryAnalysis,
  type LengthConfig,
  analyzeQuery,
  getOptimalMaxTokens,
  adjustForContext,
  getThinkingBudget,
  enforceTokenLimits,
  getResponseLengthConfig,
} from './lengthController';

export {
  // Templates
  RESPONSE_TEMPLATES,
  StatusCheckSchema,
  ErrorAnalysisSchema,
  ListItemsSchema,
  YesNoSchema,
  MetricAnalysisSchema,
  TroubleshootingSchema,
  StructuredResponseSchema,
  type StatusCheckResponse,
  type ErrorAnalysisResponse,
  type ListItemsResponse,
  type YesNoResponse,
  type MetricAnalysisResponse,
  type TroubleshootingResponse,
  type StructuredResponse,
  selectTemplate,
  getTemplateInstruction,
  validateResponse,
  parseStructuredResponse,
  formatResponse,
} from './templates';

export {
  // Compressor
  type CompressionMode,
  type CompressionResult,
  compressResponse,
  autoCompress,
  extractSummary,
  removeCodeBlocks,
  extractCodeBlocks,
  compressSelective,
  StreamCompressor,
  createCompressionReport,
} from './compressor';
