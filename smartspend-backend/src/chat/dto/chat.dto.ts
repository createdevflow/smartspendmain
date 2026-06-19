import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { MessageType } from '@prisma/client';

export class SendMessageDto {
  @IsString()
  conversationId: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsEnum(MessageType)
  type: MessageType = MessageType.TEXT;

  @IsOptional()
  @IsString()
  replyToId?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateConversationDto {
  @IsArray()
  @IsString({ each: true })
  participantIds: string[];

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  cashbookId?: string;
}

export class EditMessageDto {
  @IsString()
  messageId: string;

  @IsString()
  content: string;
}

export class ReactMessageDto {
  @IsString()
  messageId: string;

  @IsString()
  emoji: string;
}

export class SendContactRequestDto {
  @IsString()
  toUserId: string;
}
