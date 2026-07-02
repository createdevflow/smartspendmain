// components/chat/MessageBubble.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  Pressable, Modal, Image
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import TransactionCard from './TransactionCard';
import FinancialShareCard from './FinancialShareCard';

const REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

export default function MessageBubble({
  message,
  isOwn,
  onReply,
  onReact,
  onEdit,
  onDelete,
  onCopy,
  onStar,
  onPin,
  onForward,
  onRemind,
  onViewPress,
  currencySymbol,
}) {
  const [showMenu, setShowMenu] = useState(false);

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
      return (
        <Image
          source={{ uri: message.mediaUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      );
    }

    if (isFinancial) {
      if (message.metadata) {
        return (
          <View>
            {message.content && !message.content.startsWith('Shared a ') ? (
              <Text style={[styles.msgText, isSelf ? styles.ownText : styles.otherText, { marginBottom: 8 }]}>
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

  const reactionSummary = (message.reactions || []).reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  const timeStr = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : '';

  return (
    <View style={[styles.row, isSelf && styles.rowOwn]}>
      {/* Avatar for others */}
      {!isSelf && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(message.sender?.fullName || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <Pressable
        style={[styles.bubble, isSelf ? styles.ownBubble : styles.otherBubble]}
        onLongPress={() => !isDeleted && setShowMenu(true)}
        onPress={() => {
          if (isFinancial && !isDeleted && onViewPress) onViewPress(message);
        }}
        delayLongPress={350}
      >
        {/* Forwarded indicator */}
        {message.forwardedFromId && (
          <View style={styles.forwardedTag}>
            <Feather name="corner-up-right" size={11} color={isSelf ? 'rgba(255,255,255,0.7)' : '#9CA3AF'} />
            <Text style={[styles.forwardedText, isSelf && styles.forwardedTextOwn]}>Forwarded</Text>
          </View>
        )}

        {/* Pinned indicator */}
        {message.isPinned && (
          <View style={styles.pinnedTag}>
            <Feather name="bookmark" size={11} color={isSelf ? 'rgba(255,255,255,0.7)' : '#6366F1'} />
          </View>
        )}

        {/* Reply preview */}
        {message.replyTo && !isDeleted && (
          <View style={[styles.replyBar, isSelf && styles.replyBarOwn]}>
            <View style={styles.replyAccent} />
            <View>
              <Text style={[styles.replyName, isSelf && styles.replyNameOwn]}>
                {message.replyTo.sender?.fullName || 'User'}
              </Text>
              <Text style={[styles.replyContent, isSelf && styles.replyContentOwn]} numberOfLines={1}>
                {message.replyTo.content || '📎 Media'}
              </Text>
            </View>
          </View>
        )}

        {/* Sender name (group chats) */}
        {!isSelf && message.sender?.fullName && (
          <Text style={styles.senderName}>{message.sender.fullName}</Text>
        )}

        {renderContent()}

        {/* Edited tag */}
        {message.isEdited && !isDeleted && (
          <Text style={[styles.editedTag, isSelf && styles.editedTagOwn]}>edited</Text>
        )}

        {/* Time + status ticks */}
        <View style={[styles.metaRow, isSelf && styles.metaRowOwn]}>
          <Text style={[styles.time, isSelf ? styles.timeOwn : styles.timeOther]}>
            {timeStr}
          </Text>
          {isSelf && (
            <View style={{ flexDirection: 'row', marginLeft: 3 }}>
              {message.status === 'READ' ? (
                <>
                  <Ionicons name="checkmark" size={13} color="#38BDF8" />
                  <Ionicons name="checkmark" size={13} color="#38BDF8" style={{ marginLeft: -5 }} />
                </>
              ) : message.status === 'DELIVERED' ? (
                <>
                  <Ionicons name="checkmark" size={13} color="rgba(255,255,255,0.7)" />
                  <Ionicons name="checkmark" size={13} color="rgba(255,255,255,0.7)" style={{ marginLeft: -5 }} />
                </>
              ) : (
                <Ionicons name="checkmark" size={13} color="rgba(255,255,255,0.5)" />
              )}
            </View>
          )}
        </View>

        {/* Reactions */}
        {Object.keys(reactionSummary).length > 0 && (
          <View style={styles.reactions}>
            {Object.entries(reactionSummary).map(([emoji, count]) => (
              <TouchableOpacity
                key={emoji}
                style={styles.reaction}
                onPress={() => onReact && onReact(message.id, emoji, message.conversationId)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                {count > 1 && <Text style={styles.reactionCount}>{count}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Pressable>

      {/* Reaction quick row (tap to react) */}
      {showMenu && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
          <Pressable style={styles.menuBackdrop} onPress={() => setShowMenu(false)}>
            <View style={styles.menuContainer}>
              {/* Quick reactions */}
              <View style={styles.quickReactions}>
                {REACTIONS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={styles.quickReaction}
                    onPress={() => {
                      setShowMenu(false);
                      onReact && onReact(message.id, emoji, message.conversationId);
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action menu */}
              <View style={styles.menu}>
                <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); onReply && onReply(message); }}>
                  <Feather name="corner-up-left" size={16} color="#374151" />
                  <Text style={styles.menuText}>Reply</Text>
                </TouchableOpacity>
                {isText && (
                  <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); onCopy && onCopy(message.content); }}>
                    <Feather name="copy" size={16} color="#374151" />
                    <Text style={styles.menuText}>Copy</Text>
                  </TouchableOpacity>
                )}
                {/* Star */}
                <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); onStar && onStar(message); }}>
                  <Feather name="star" size={16} color="#F59E0B" />
                  <Text style={styles.menuText}>Star</Text>
                </TouchableOpacity>

                {/* Pin */}
                <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); onPin && onPin(message); }}>
                  <Feather name="bookmark" size={16} color="#6366F1" />
                  <Text style={styles.menuText}>{message.isPinned ? 'Unpin' : 'Pin'}</Text>
                </TouchableOpacity>

                {/* Forward */}
                <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); onForward && onForward(message); }}>
                  <Feather name="corner-up-right" size={16} color="#374151" />
                  <Text style={styles.menuText}>Forward</Text>
                </TouchableOpacity>

                {/* Remind Me */}
                <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); onRemind && onRemind(message); }}>
                  <Feather name="bell" size={16} color="#0EA5E9" />
                  <Text style={styles.menuText}>Remind Me</Text>
                </TouchableOpacity>

                {isSelf && isText && (
                  <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); onEdit && onEdit(message); }}>
                    <Feather name="edit-2" size={16} color="#374151" />
                    <Text style={styles.menuText}>Edit</Text>
                  </TouchableOpacity>
                )}
                {isSelf && (
                  <TouchableOpacity style={styles.menuItem} onPress={() => {
                    setShowMenu(false);
                    Alert.alert('Delete Message', 'This message will be deleted for everyone.', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => onDelete && onDelete(message.id) },
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
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 12,
    marginVertical: 2,
    gap: 8,
  },
  rowOwn: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    padding: 10,
    paddingHorizontal: 14,
  },
  ownBubble: {
    backgroundColor: '#1D4ED8',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 22,
  },
  ownText: { color: '#fff' },
  otherText: { color: '#111827' },
  deletedText: {
    fontStyle: 'italic',
    color: '#9CA3AF',
    fontSize: 13,
  },
  deletedTextOwn: {
    color: 'rgba(255,255,255,0.6)',
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 3,
  },
  replyBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 8,
    padding: 6,
    marginBottom: 6,
    gap: 6,
  },
  replyBarOwn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  replyAccent: {
    width: 3,
    borderRadius: 2,
    backgroundColor: '#60A5FA',
  },
  replyName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  replyNameOwn: { color: '#93C5FD' },
  replyContent: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  replyContentOwn: { color: 'rgba(255,255,255,0.7)' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-start',
  },
  metaRowOwn: { justifyContent: 'flex-end' },
  time: { fontSize: 10 },
  timeOwn: { color: 'rgba(255,255,255,0.6)' },
  timeOther: { color: '#9CA3AF' },
  editedTag: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 2,
  },
  editedTagOwn: { color: 'rgba(255,255,255,0.5)', textAlign: 'right' },
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { fontSize: 11, color: '#fff', fontWeight: '600' },
  image: {
    width: 220,
    height: 160,
    borderRadius: 12,
  },
  mediaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  // Menu
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  menuContainer: {
    width: '85%',
    maxWidth: 320,
  },
  quickReactions: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'space-between',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  quickReaction: {
    padding: 4,
    borderRadius: 20,
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
  menuText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  forwardedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  forwardedText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  forwardedTextOwn: {
    color: 'rgba(255,255,255,0.6)',
  },
  pinnedTag: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
});
