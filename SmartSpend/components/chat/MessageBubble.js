// components/chat/MessageBubble.js — Modern Premium WhatsApp/Telegram style Message Bubble
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  Pressable, Modal, Animated
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import FinancialShareCard from './FinancialShareCard';
import OptimizedImage from '../OptimizedImage';
import { useAppTheme } from '../../context/ThemeContext';
import { api } from '../../utils/api';

const getValidMediaUrl = (url) => {
  if (!url) return null;
  try {
    const apiHostUrl = new URL(api.defaults.baseURL); // e.g. http://192.168.1.8:3000/api/v1
    const deviceIp = apiHostUrl.hostname; // 192.168.1.8
    
    let parsedUrl = new URL(url);
    
    // If the URL is hitting the MinIO port directly (9000), rewrite it to the backend proxy route
    if (parsedUrl.port === '9000') {
      const pathWithoutMedia = parsedUrl.pathname.replace(/^\/media\//, '');
      return `${api.defaults.baseURL}/media/file/${pathWithoutMedia}`;
    }
    
    // Replace localhost or 127.0.0.1 with deviceIp, preserving the original port
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      return url.replace(/(localhost|127\.0\.0\.1)/, deviceIp);
    }
    return url;
  } catch {
    return url;
  }
};

const REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

export default function MessageBubble({
  message,
  isOwn,
  isConsecutivePrevious,
  isConsecutiveNext,
  onReply,
  onReact,
  onEdit,
  onDelete,
  onCopy,
  onStar,
  onPin,
  onForward,
  onRemind,
  onSchedule,
  onViewPress,
  isNotesSelf,
  onAIAction,
  onSmartAction,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const { isDark, theme } = useAppTheme();
  const [showReactions, setShowReactions] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const isSelf = isOwn;
  const isDeleted = !!message.deletedAt;
  const msgType = (message.type || 'TEXT').toUpperCase();
  const isText = msgType === 'TEXT';
  const isImage = msgType === 'IMAGE';
  const isFinancial = ['TRANSACTION', 'BUDGET', 'GOAL', 'REPORT', 'INVOICE', 'PASSBOOK', 'RECEIPT', 'DOCUMENT', 'VOICE'].includes(msgType);

  const renderContent = () => {
    if (isDeleted) return (
      <Text style={[styles.deletedText, isSelf && styles.deletedTextOwn]}>
        🚫 This message was deleted
      </Text>
    );

    if (isText) return (
      <Text style={[styles.msgText, isSelf ? styles.ownText : styles.otherText]}>
        {message.content}
      </Text>
    );

    if (isImage || (msgType === 'RECEIPT' && message.mediaUrl)) {
      const validMediaUrl = getValidMediaUrl(message.mediaUrl);
      return (
        <View style={styles.imageBox}>
          {!imgError ? (
            <Pressable onPress={() => setShowFullScreenImage(true)}>
              <OptimizedImage
                source={{ uri: validMediaUrl }}
                style={styles.image}
                contentFit="cover"
                size="medium"
                onError={() => setImgError(true)}
              />
            </Pressable>
          ) : (
            <View style={[styles.image, { backgroundColor: isSelf ? 'rgba(255,255,255,0.1)' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }]}>
              <Feather name="image" size={32} color={isSelf ? 'rgba(255,255,255,0.5)' : '#9CA3AF'} />
              <Text style={{ color: isSelf ? 'rgba(255,255,255,0.7)' : '#6B7280', fontSize: 12, marginTop: 4 }}>Media not available</Text>
            </View>
          )}
          {message.content && message.content !== message.mediaUrl ? (
            <Text style={[styles.msgText, isSelf ? styles.ownText : styles.otherText, { marginTop: 6 }]}>
              {message.content}
            </Text>
          ) : null}
        </View>
      );
    }

    if (isFinancial) {
      if (message.metadata) {
        return (
          <View>
            {message.content && !message.content.startsWith('Shared a ') ? (
              <Text style={[styles.msgText, isSelf ? styles.ownText : styles.otherText, { marginBottom: 6 }]}>
                {message.content}
              </Text>
            ) : null}
            <FinancialShareCard
              type={msgType}
              metadata={message.metadata}
              isOwn={isSelf}
              onViewPress={onViewPress ? () => onViewPress(message) : undefined}
            />
          </View>
        );
      }
      return (
        <Text style={[styles.msgText, isSelf ? styles.ownText : styles.otherText]}>
          {message.content || msgType}
        </Text>
      );
    }

    return (
      <Text style={[styles.msgText, isSelf ? styles.ownText : styles.otherText]}>
        {message.content}
      </Text>
    );
  };

  const renderAIAnalysis = () => {
    if (!isNotesSelf || !message.metadata?.aiAnalysis) return null;
    const ai = message.metadata.aiAnalysis;
    const hasTags = ai.tags?.length > 0 || ai.categories?.length > 0;
    const hasActions = (ai.transactions?.length > 0 || ai.tasks?.length > 0 || ai.budgets?.length > 0);

    if (!hasTags && !hasActions && !ai.summary) return null;

    return (
      <View style={[styles.aiBox, isSelf ? styles.aiBoxOwn : styles.aiBoxOther]}>
        {ai.summary && (
          <Text style={[styles.aiSummary, isSelf ? styles.aiSummaryOwn : styles.aiSummaryOther]}>
            ✨ {ai.summary}
          </Text>
        )}
        {hasTags && (
          <View style={styles.aiTagsRow}>
            {ai.categories?.map((c, i) => <Text key={`c-${i}`} style={styles.aiTag}>📂 {c}</Text>)}
            {ai.tags?.map((t, i) => <Text key={`t-${i}`} style={styles.aiTag}>#{t}</Text>)}
          </View>
        )}
        {hasActions && (
          <View style={styles.aiActionsRow}>
            {ai.transactions?.map((t, i) => {
              const isAuto = ai.autoRegistered || message.metadata?.isAiBotResponse;
              return (
                <TouchableOpacity
                  key={`tx-${i}`}
                  style={[styles.aiActionBtn, isAuto && { backgroundColor: '#ECFDF5', borderColor: '#10B981' }]}
                  onPress={() => {
                    if (isAuto && onSmartAction) {
                      onSmartAction({ type: 'view_transactions' });
                    } else if (onSmartAction) {
                      onSmartAction({ type: 'transaction', data: t });
                    }
                  }}
                >
                  <Feather name={isAuto ? "check-circle" : "plus-circle"} size={12} color={isAuto ? "#10B981" : "#2D8CFF"} />
                  <Text style={[styles.aiActionText, isAuto && { color: '#10B981', fontWeight: '600' }]}>
                    {isAuto ? `✓ Registered in ${t.type === 'EXPENSE' ? 'Expenses' : 'Income'} (${t.amount})` : `${t.type === 'EXPENSE' ? 'Add Expense' : 'Add Income'} ${t.amount}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {ai.tasks?.map((t, i) => {
              const isAuto = ai.autoRegistered || message.metadata?.isAiBotResponse;
              return (
                <TouchableOpacity
                  key={`task-${i}`}
                  style={[styles.aiActionBtn, isAuto && { backgroundColor: '#ECFDF5', borderColor: '#10B981' }]}
                  onPress={() => {
                    if (isAuto && onSmartAction) {
                      onSmartAction({ type: 'view_tasks' });
                    } else if (onSmartAction) {
                      onSmartAction({ type: 'task', data: t });
                    }
                  }}
                >
                  <Feather name={isAuto ? "check-circle" : "check-square"} size={12} color={isAuto ? "#10B981" : "#2D8CFF"} />
                  <Text style={[styles.aiActionText, isAuto && { color: '#10B981', fontWeight: '600' }]}>
                    {isAuto ? `✓ Registered in Reminders` : `Add Task`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const reactionSummary = (message.reactions || []).reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  const timeStr = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : '';

  // Calculate dynamic border radii for grouped messages
  const bubbleRadiusStyle = isSelf
    ? {
        borderTopRightRadius: isConsecutivePrevious ? 4 : 16,
        borderBottomRightRadius: isConsecutiveNext ? 4 : 16,
      }
    : {
        borderTopLeftRadius: isConsecutivePrevious ? 4 : 16,
        borderBottomLeftRadius: isConsecutiveNext ? 4 : 16,
      };

  const renderStatusIcon = () => {
    if (!isSelf) return null;
    switch (message.status) {
      case 'SENDING':
        return <Feather name="clock" size={11} color="rgba(255,255,255,0.7)" style={{ marginLeft: 3 }} />;
      case 'FAILED':
        return <Feather name="alert-circle" size={11} color="#FECACA" style={{ marginLeft: 3 }} />;
      case 'READ':
        return (
          <View style={styles.ticks}>
            <Ionicons name="checkmark" size={13} color="#60A5FA" />
            <Ionicons name="checkmark" size={13} color="#60A5FA" style={styles.tickOverlay} />
          </View>
        );
      case 'DELIVERED':
        return (
          <View style={styles.ticks}>
            <Ionicons name="checkmark" size={13} color="rgba(255,255,255,0.7)" />
            <Ionicons name="checkmark" size={13} color="rgba(255,255,255,0.7)" style={styles.tickOverlay} />
          </View>
        );
      case 'SENT':
      default:
        return <Ionicons name="checkmark" size={13} color="rgba(255,255,255,0.7)" style={{ marginLeft: 2 }} />;
    }
  };

  return (
    <Pressable 
      style={[
        styles.row, 
        isSelf && styles.rowOwn, 
        { marginVertical: isConsecutivePrevious ? 1 : 3 },
        showMenu && { backgroundColor: 'rgba(45, 140, 255, 0.15)' }
      ]}
      onLongPress={() => !isDeleted && setShowMenu(true)}
      delayLongPress={300}
    >
      {/* Avatar for receiver (only show on the last message of consecutive group) */}
      {!isSelf && (
        <View style={styles.avatarCol}>
          {!isConsecutiveNext ? (
            <View style={[styles.avatar, (message.metadata?.isAiBotResponse || message.sender?.fullName === 'AI Assistant' || (typeof message.content === 'string' && (message.content.includes('**AI Assistant Insight**') || message.content.includes('**AI Agent Execution Insight**') || message.content.includes('🤖')))) ? { backgroundColor: '#8B5CF6' } : {}]}>
              {(message.metadata?.isAiBotResponse || message.sender?.fullName === 'AI Assistant' || (typeof message.content === 'string' && (message.content.includes('**AI Assistant Insight**') || message.content.includes('**AI Agent Execution Insight**') || message.content.includes('🤖')))) ? (
                <Text style={{ fontSize: 16 }}>🤖</Text>
              ) : (
                <Text style={styles.avatarText}>
                  {(message.sender?.fullName || '?').charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.avatarSpacer} />
          )}
        </View>
      )}

      <Pressable
        style={[styles.bubble, isSelf ? styles.ownBubble : styles.otherBubble, bubbleRadiusStyle]}
        onLongPress={() => !isDeleted && setShowMenu(true)}
        onPress={() => {
          if (isFinancial && !isDeleted && onViewPress) onViewPress(message);
        }}
        delayLongPress={300}
      >
        {/* Forwarded indicator */}
        {message.forwardedFromId && (
          <View style={styles.forwardedTag}>
            <Feather name="corner-up-right" size={11} color={isSelf ? 'rgba(255,255,255,0.75)' : '#6B7280'} />
            <Text style={[styles.forwardedText, isSelf && styles.forwardedTextOwn]}>Forwarded</Text>
          </View>
        )}

        {/* Pinned indicator */}
        {message.isPinned && (
          <View style={styles.pinnedTag}>
            <Feather name="bookmark" size={11} color={isSelf ? 'rgba(255,255,255,0.8)' : '#2D8CFF'} />
            <Text style={[styles.pinnedText, isSelf && { color: 'rgba(255,255,255,0.8)' }]}>Pinned</Text>
          </View>
        )}

        {/* Sender name in group chats (only on first message of consecutive group) */}
        {!isSelf && !isConsecutivePrevious && message.sender?.fullName && (
          <Text style={styles.senderName}>{message.sender.fullName}</Text>
        )}

        {/* WhatsApp style Quoted Reply preview inside bubble */}
        {message.replyTo && !isDeleted && (
          <View style={[styles.replyBar, isSelf ? styles.replyBarOwn : styles.replyBarOther]}>
            <View style={[styles.replyAccent, { backgroundColor: isSelf ? '#FFFFFF' : '#2D8CFF' }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.replyName, isSelf ? styles.replyNameOwn : styles.replyNameOther]}>
                {message.replyTo.sender?.fullName || 'User'}
              </Text>
              <Text style={[styles.replyContent, isSelf ? styles.replyContentOwn : styles.replyContentOther]} numberOfLines={1}>
                {message.replyTo.content || '📎 Attached item'}
              </Text>
            </View>
          </View>
        )}

        {/* Main Content */}
        {renderContent()}

        {/* AI Analysis Bar */}
        {renderAIAnalysis()}

        {/* Time + Status Footer */}
        <View style={styles.footerRow}>
          {message.isEdited && !isDeleted && (
            <Text style={[styles.editedText, isSelf && styles.editedTextOwn]}>edited · </Text>
          )}
          <Text style={[styles.timeText, isSelf ? styles.timeTextOwn : styles.timeTextOther]}>
            {timeStr}
          </Text>
          {renderStatusIcon()}
        </View>

        {/* Reactions floating bottom-right */}
        {Object.keys(reactionSummary).length > 0 && (
          <View style={[styles.reactionsRow, isSelf ? styles.reactionsRowOwn : styles.reactionsRowOther]}>
            {Object.entries(reactionSummary).map(([emoji, count]) => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionChip}
                onPress={() => onReact && onReact(message.id, emoji, message.conversationId)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                {count > 1 && <Text style={styles.reactionCount}>{count}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Pressable>

      {/* Long-Press Action Sheet Modal */}
      {showMenu && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
          <Pressable style={styles.menuBackdrop} onPress={() => setShowMenu(false)}>
            <View style={styles.menuContainer}>
              {/* Quick Reactions Bar */}
              <View style={[styles.quickReactions, isDark && { backgroundColor: theme.colors.card }]}>
                {REACTIONS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={styles.quickReactionBtn}
                    onPress={() => {
                      setShowMenu(false);
                      onReact && onReact(message.id, emoji, message.conversationId);
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action Menu Grid/List */}
              <View style={[styles.menuBox, isDark && { backgroundColor: theme.colors.card }]}>
                <TouchableOpacity style={[styles.menuItem, isDark && { borderBottomColor: 'rgba(255,255,255,0.05)' }]} onPress={() => { setShowMenu(false); onReply && onReply(message); }}>
                  <Feather name="corner-up-left" size={16} color={isDark ? '#F8FAFC' : '#374151'} />
                  <Text style={[styles.menuText, isDark && { color: '#F8FAFC' }]}>Reply</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.menuItem, isDark && { borderBottomColor: 'rgba(255,255,255,0.05)' }]} onPress={() => { setShowMenu(false); onForward && onForward(message); }}>
                  <Feather name="corner-up-right" size={16} color={isDark ? '#F8FAFC' : '#374151'} />
                  <Text style={[styles.menuText, isDark && { color: '#F8FAFC' }]}>Forward</Text>
                </TouchableOpacity>

                {isText && (
                  <TouchableOpacity style={[styles.menuItem, isDark && { borderBottomColor: 'rgba(255,255,255,0.05)' }]} onPress={() => { setShowMenu(false); onCopy && onCopy(message.content); }}>
                    <Feather name="copy" size={16} color={isDark ? '#F8FAFC' : '#374151'} />
                    <Text style={[styles.menuText, isDark && { color: '#F8FAFC' }]}>Copy</Text>
                  </TouchableOpacity>
                )}

                {isNotesSelf && isText && (
                  <>
                    <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 4 }} />
                    <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); onAIAction && onAIAction('summarize'); }}>
                      <Feather name="zap" size={16} color="#8B5CF6" />
                      <Text style={[styles.menuText, { color: '#8B5CF6' }]}>Summarize</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); onAIAction && onAIAction('rewrite'); }}>
                      <Feather name="edit-3" size={16} color="#8B5CF6" />
                      <Text style={[styles.menuText, { color: '#8B5CF6' }]}>Rewrite nicely</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); onAIAction && onAIAction('fix_grammar'); }}>
                      <Feather name="check-circle" size={16} color="#8B5CF6" />
                      <Text style={[styles.menuText, { color: '#8B5CF6' }]}>Fix Grammar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); onAIAction && onAIAction('translate_hindi'); }}>
                      <Feather name="globe" size={16} color="#8B5CF6" />
                      <Text style={[styles.menuText, { color: '#8B5CF6' }]}>Translate to Hindi</Text>
                    </TouchableOpacity>
                    <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 4 }} />
                  </>
                )}

                <TouchableOpacity style={[styles.menuItem, isDark && { borderBottomColor: 'rgba(255,255,255,0.05)' }]} onPress={() => { setShowMenu(false); onStar && onStar(message); }}>
                  <Feather name="star" size={16} color="#F59E0B" />
                  <Text style={[styles.menuText, isDark && { color: '#F8FAFC' }]}>Star</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.menuItem, isDark && { borderBottomColor: 'rgba(255,255,255,0.05)' }]} onPress={() => { setShowMenu(false); onPin && onPin(message); }}>
                  <Feather name="bookmark" size={16} color="#2D8CFF" />
                  <Text style={[styles.menuText, isDark && { color: '#F8FAFC' }]}>{message.isPinned ? 'Unpin' : 'Pin'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.menuItem, isDark && { borderBottomColor: 'rgba(255,255,255,0.05)' }]} onPress={() => { setShowMenu(false); onRemind && onRemind(message); }}>
                  <Feather name="bell" size={16} color="#0EA5E9" />
                  <Text style={[styles.menuText, isDark && { color: '#F8FAFC' }]}>Reminder</Text>
                </TouchableOpacity>

                {onSchedule && (
                  <TouchableOpacity style={[styles.menuItem, isDark && { borderBottomColor: 'rgba(255,255,255,0.05)' }]} onPress={() => { setShowMenu(false); onSchedule(message); }}>
                    <Feather name="clock" size={16} color="#6366F1" />
                    <Text style={[styles.menuText, isDark && { color: '#F8FAFC' }]}>Schedule</Text>
                  </TouchableOpacity>
                )}

                {isSelf && isText && (
                  <TouchableOpacity style={[styles.menuItem, isDark && { borderBottomColor: 'rgba(255,255,255,0.05)' }]} onPress={() => { setShowMenu(false); onEdit && onEdit(message); }}>
                    <Feather name="edit-2" size={16} color={isDark ? '#F8FAFC' : '#374151'} />
                    <Text style={[styles.menuText, isDark && { color: '#F8FAFC' }]}>Edit</Text>
                  </TouchableOpacity>
                )}

                {isSelf && (
                  <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => {
                    setShowMenu(false);
                    Alert.alert('Delete Message?', 'This cannot be undone.', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => onDelete && onDelete(message.id) }
                    ]);
                  }}>
                    <Feather name="trash-2" size={16} color="#EF4444" />
                    <Text style={[styles.menuText, { color: '#EF4444' }]}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* Full Screen Image Modal */}
      <Modal
        visible={showFullScreenImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullScreenImage(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }}
            onPress={() => setShowFullScreenImage(false)}
          >
            <Feather name="x" size={24} color="white" />
          </TouchableOpacity>
          <OptimizedImage
            source={{ uri: getValidMediaUrl(message.mediaUrl) }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            size="original"
          />
        </View>
      </Modal>

    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 2,
    gap: 6,
  },
  rowOwn: {
    flexDirection: 'row-reverse',
  },
  avatarCol: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  avatarSpacer: {
    width: 28,
    height: 28,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2D8CFF',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 11,
    paddingTop: 7,
    paddingBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  ownBubble: {
    backgroundColor: '#2D8CFF',
  },
  otherBubble: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  forwardedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  forwardedText: {
    fontSize: 10,
    color: '#747487',
    fontStyle: 'italic',
  },
  forwardedTextOwn: {
    color: 'rgba(255,255,255,0.75)',
  },
  aiBox: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
  },
  aiBoxOwn: {
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  aiBoxOther: {
    borderTopColor: '#E5E7EB',
  },
  aiSummary: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  aiSummaryOwn: {
    color: 'rgba(255,255,255,0.85)',
  },
  aiSummaryOther: {
    color: '#4B5563',
  },
  aiTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  aiTag: {
    fontSize: 11,
    backgroundColor: 'rgba(45, 140, 255, 0.1)',
    color: '#2D8CFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  aiActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  aiActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  aiActionText: {
    fontSize: 11,
    color: '#2D8CFF',
    fontWeight: '600',
  },
  pinnedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  pinnedText: {
    fontSize: 10,
    color: '#2D8CFF',
    fontWeight: '600',
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2D8CFF',
    marginBottom: 3,
  },
  replyBar: {
    flexDirection: 'row',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 6,
    gap: 6,
  },
  replyBarOwn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  replyBarOther: {
    backgroundColor: '#F1F5F9',
  },
  replyAccent: {
    width: 3,
    borderRadius: 1.5,
  },
  replyName: {
    fontSize: 11,
    fontWeight: '700',
  },
  replyNameOwn: {
    color: '#FFFFFF',
  },
  replyNameOther: {
    color: '#2D8CFF',
  },
  replyContent: {
    fontSize: 11,
  },
  replyContentOwn: {
    color: 'rgba(255,255,255,0.85)',
  },
  replyContentOther: {
    color: '#4B5563',
  },
  msgText: {
    fontSize: 14,
    lineHeight: 19,
  },
  ownText: {
    color: '#FFFFFF',
  },
  otherText: {
    color: '#232333',
  },
  deletedText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  deletedTextOwn: {
    color: 'rgba(255,255,255,0.7)',
  },
  imageBox: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 2,
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
    marginBottom: -1,
  },
  timeText: {
    fontSize: 10,
  },
  timeTextOwn: {
    color: 'rgba(255,255,255,0.7)',
  },
  timeTextOther: {
    color: '#9CA3AF',
  },
  editedText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  editedTextOwn: {
    color: 'rgba(255,255,255,0.7)',
  },
  ticks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 3,
  },
  tickOverlay: {
    marginLeft: -6,
  },
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  reactionsRowOwn: {
    justifyContent: 'flex-end',
  },
  reactionsRowOther: {
    justifyContent: 'flex-start',
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 3,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  menuContainer: {
    width: '85%',
    maxWidth: 320,
    gap: 12,
  },
  quickReactions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  quickReactionBtn: {
    padding: 2,
  },
  menuBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  menuText: {
    fontSize: 15,
    color: '#232333',
    fontWeight: '500',
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignSelf: 'flex-start',
  },
});
