
import SendbirdChat from '@sendbird/chat';
import { GroupChannelModule } from '@sendbird/chat/groupChannel';

// Initialize the Sendbird SDK
const sb = SendbirdChat.init({
  appId: 'E1BC028A-AE99-4796-8F7F-8A34B8B23B8F',
  modules: [new GroupChannelModule()]
});

interface SendbirdMessage {
  message: string;
  sender: {
    userId: string;
    nickname?: string;
  };
  createdAt: number;
}

export const connectToSendbird = async (userId: string, nickname?: string) => {
  try {
    const user = await sb.connect(userId);
    
    if (nickname) {
      await sb.updateCurrentUserInfo({
        nickname: nickname
      });
    }
    
    return user;
  } catch (error) {
    console.error('Error connecting to Sendbird:', error);
    throw error;
  }
};

export const createGroupChannel = async (userIds: string[], channelName: string) => {
  try {
    const groupChannel = await sb.groupChannel.createChannel({
      userIds: userIds,
      name: channelName
    });
    return groupChannel;
  } catch (error) {
    console.error('Error creating group channel:', error);
    throw error;
  }
};

export const sendMessage = async (channelUrl: string, message: string) => {
  try {
    const channel = await sb.groupChannel.getChannel(channelUrl);
    const userMessage = await channel.sendUserMessage({
      message
    });
    return userMessage;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getMessages = async (channelUrl: string) => {
  try {
    const channel = await sb.groupChannel.getChannel(channelUrl);
    const messages = await channel.getMessagesByTimestamp(Date.now(), {
      prevResultSize: 20,
      nextResultSize: 0
    });
    return messages;
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

export const disconnectFromSendbird = async () => {
  try {
    await sb.disconnect();
  } catch (error) {
    console.error('Error disconnecting from Sendbird:', error);
    throw error;
  }
};
