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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { BoardsService } from './boards.service';
import { CreateBoardDto, UpdateBoardDto, InviteDto } from './dto/board.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('boards')
@Controller('boards')
export class BoardsController {
  constructor(private boardsService: BoardsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new board' })
  async create(@CurrentUser() user, @Body() dto: CreateBoardDto) {
    return this.boardsService.create(user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user boards' })
  async findAll(@CurrentUser() user) {
    return this.boardsService.findAll(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get board by ID' })
  async findById(@Param('id') id: string) {
    return this.boardsService.findById(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get board by slug (public)' })
  async findBySlug(@Param('slug') slug: string) {
    return this.boardsService.findBySlug(slug);
  }

  @Get('invite/:inviteCode')
  @ApiOperation({ summary: 'Get board by invite code' })
  async findByInviteCode(@Param('inviteCode') inviteCode: string) {
    return this.boardsService.findByInviteCode(inviteCode);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update board (owner/admin)' })
  async update(
    @CurrentUser() user,
    @Param('id') id: string,
    @Body() dto: UpdateBoardDto,
  ) {
    return this.boardsService.update(user.id, id, dto);
  }

  @Post(':id/invite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite member (owner/admin)' })
  async invite(
    @CurrentUser() user,
    @Param('id') id: string,
    @Body() dto: InviteDto,
  ) {
    return this.boardsService.inviteMember(user.id, id, dto);
  }

  @Post('join/:inviteCode')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join board by invite code' })
  async join(@CurrentUser() user, @Param('inviteCode') inviteCode: string) {
    return this.boardsService.joinByInviteCode(user.id, inviteCode);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get board members' })
  async getMembers(@Param('id') id: string) {
    return this.boardsService.getMembers(id);
  }

  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove member (owner only)' })
  async removeMember(
    @CurrentUser() user,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.boardsService.removeMember(user.id, id, userId);
  }

  @Patch(':id/members/:userId/role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update member role (owner only)' })
  async updateRole(
    @CurrentUser() user,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('role') role: 'admin' | 'member',
  ) {
    return this.boardsService.updateRole(user.id, id, userId, role);
  }
}
