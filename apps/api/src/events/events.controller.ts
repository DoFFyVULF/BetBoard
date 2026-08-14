import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: { sub: string; email?: string; name: string; avatar: string };
}

@ApiTags('Events')
@Controller('boards/:boardId/events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created' })
  async createEvent(
    @Param('boardId') boardId: string,
    @Req() req: AuthRequest,
    @Body() dto: CreateEventDto,
  ) {
    const seasonId = dto.seasonId || undefined;
    return this.eventsService.createEvent(boardId, seasonId, req.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List events for a board' })
  async getEvents(
    @Param('boardId') boardId: string,
    @Query('seasonId') seasonId?: string,
  ) {
    return this.eventsService.getEvents(boardId, seasonId);
  }

  @Get(':eventId')
  @ApiOperation({ summary: 'Get event by ID' })
  async getEvent(@Param('eventId') eventId: string) {
    return this.eventsService.getEventById(eventId);
  }

  @Patch(':eventId')
  @ApiOperation({ summary: 'Update event (draft only)' })
  async updateEvent(
    @Param('eventId') eventId: string,
    @Req() req: AuthRequest,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.updateEvent(eventId, req.user.sub, dto);
  }

  @Post(':eventId/open')
  @ApiOperation({ summary: 'Open event for betting' })
  async openEvent(@Param('eventId') eventId: string, @Req() req: AuthRequest) {
    return this.eventsService.openEvent(eventId, req.user.sub);
  }

  @Post(':eventId/close')
  @ApiOperation({ summary: 'Close event for betting' })
  async closeEvent(@Param('eventId') eventId: string, @Req() req: AuthRequest) {
    return this.eventsService.closeEvent(eventId, req.user.sub);
  }

  @Post(':eventId/cancel')
  @ApiOperation({ summary: 'Cancel event and refund bets' })
  async cancelEvent(
    @Param('eventId') eventId: string,
    @Req() req: AuthRequest,
  ) {
    return this.eventsService.cancelEvent(eventId, req.user.sub);
  }

  @Delete(':eventId')
  @ApiOperation({ summary: 'Delete draft event' })
  async deleteEvent(
    @Param('eventId') eventId: string,
    @Req() req: AuthRequest,
  ) {
    return this.eventsService.deleteEvent(eventId, req.user.sub);
  }
}

// Separate controller for direct event access without board prefix
@Controller('events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EventsPublicController {
  constructor(private eventsService: EventsService) {}

  @Get(':eventId')
  @ApiOperation({ summary: 'Get event by ID (direct)' })
  async getEvent(@Param('eventId') eventId: string) {
    return this.eventsService.getEventById(eventId);
  }

  @Patch(':eventId')
  @ApiOperation({ summary: 'Update a draft event' })
  async update(
    @Param('eventId') eventId: string,
    @Req() req: AuthRequest,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.updateEvent(eventId, req.user.sub, dto);
  }

  @Post(':eventId/open')
  @ApiOperation({ summary: 'Open a draft event for betting' })
  async open(@Param('eventId') eventId: string, @Req() req: AuthRequest) {
    return this.eventsService.openEvent(eventId, req.user.sub);
  }

  @Post(':eventId/close')
  @ApiOperation({ summary: 'Close an open event for betting' })
  async close(@Param('eventId') eventId: string, @Req() req: AuthRequest) {
    return this.eventsService.closeEvent(eventId, req.user.sub);
  }

  @Post(':eventId/cancel')
  @ApiOperation({ summary: 'Cancel an event and refund bets' })
  async cancel(@Param('eventId') eventId: string, @Req() req: AuthRequest) {
    return this.eventsService.cancelEvent(eventId, req.user.sub);
  }

  @Delete(':eventId')
  @ApiOperation({ summary: 'Delete a draft event' })
  async remove(@Param('eventId') eventId: string, @Req() req: AuthRequest) {
    return this.eventsService.deleteEvent(eventId, req.user.sub);
  }
}
