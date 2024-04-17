/* eslint-disable @typescript-eslint/no-unused-vars */
import { Message } from '../types/index.d'
import { LLmCompletionPayload, LlmChunk, LlmCompletionOpts, LlmResponse, LlmStream, LlmEventCallback } from '../types/llm.d'
import { EngineConfig, Configuration } from '../types/config.d'
import LlmEngine from './engine'

// until https://github.com/mistralai/client-js/issues/59 is fixed
//import MistralClient from '@mistralai/mistralai'
import MistralClient from '../vendor/mistralai'

export const isMistrailAIReady = (engineConfig: EngineConfig): boolean => {
  return engineConfig.models.chat.length > 0
}

export default class extends LlmEngine {

  client: MistralClient

  constructor(config: Configuration) {
    super(config)
    this.client = new MistralClient(config.engines.mistralai?.apiKey)
  }

  getName(): string {
    return 'mistralai'
  }

  getVisionModels(): string[] {
    return []
  }

  isVisionModel(model: string): boolean {
    return this.getVisionModels().includes(model)
  }

  getRountingModel(): string|null {
    return null
  }

  async getModels(): Promise<any[]> {

    // need an api key
    if (!this.client.apiKey) {
      return null
    }

    // do it
    try {
      const response = await this.client.listModels()
      return response.data
    } catch (error) {
      console.error('Error listing models:', error);
    }
  }

  async complete(thread: Message[], opts: LlmCompletionOpts): Promise<LlmResponse> {

    // call
    const model = opts?.model || this.config.engines.mistralai.model.chat
    console.log(`[mistralai] prompting model ${model}`)
    const response = await this.client.chat({
      model: model,
      messages: this.buildPayload(thread, model),
    });

    // return an object
    return {
      type: 'text',
      content: response.choices[0].message.content
    }
  }

  async stream(thread: Message[], opts: LlmCompletionOpts): Promise<LlmStream> {

    // model: switch to vision if needed
    const model = this.selectModel(thread, opts?.model || this.getChatModel())
  
    // call
    console.log(`[mistralai] prompting model ${model}`)
    const stream = this.client.chatStream({
      model: model,
      messages: this.buildPayload(thread, model),
    })

    // done
    return stream

  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async stop() {
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async streamChunkToLlmChunk(chunk: any, eventCallback: LlmEventCallback): Promise<LlmChunk|null> {
    return {
      text: chunk.choices[0].delta.content,
      done: chunk.choices[0].finish_reason != null
    }
  }

  addImageToPayload(message: Message, payload: LLmCompletionPayload) {
    payload.images = [ message.attachment.contents ]
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async image(prompt: string, opts: LlmCompletionOpts): Promise<LlmResponse|null> {
    return null    
  }
}
