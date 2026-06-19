import { Ionicons } from '@expo/vector-icons';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export type ModalButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type AppModalProps = {
  visible: boolean;
  title: string;
  message?: string;
  buttons: ModalButton[];
  onClose: () => void;
  icon?: string;
  iconColor?: string;
};

export default function AppModal({
  visible,
  title,
  message,
  buttons,
  onClose,
  icon,
  iconColor = '#7C3AED',
}: AppModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {icon && (
                <View style={[styles.iconCircle, { backgroundColor: iconColor + '22', borderColor: iconColor }]}>
                  <Ionicons name={icon as any} size={28} color={iconColor} />
                </View>
              )}
              <Text style={styles.title}>{title}</Text>
              {message && <Text style={styles.message}>{message}</Text>}
              <View style={styles.buttons}>
                {buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      button.style === 'destructive' && styles.destructiveButton,
                      button.style === 'cancel' && styles.cancelButton,
                      index > 0 && styles.buttonMargin,
                    ]}
                    onPress={() => {
                      onClose();
                      button.onPress?.();
                    }}
                  >
                    <Text style={[
                      styles.buttonText,
                      button.style === 'destructive' && styles.destructiveText,
                      button.style === 'cancel' && styles.cancelText,
                    ]}>
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff10',
  },
  iconCircle: {
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, marginBottom: 16,
  },
  title: {
    fontSize: 18, fontWeight: '700', color: 'white',
    textAlign: 'center', marginBottom: 8,
  },
  message: {
    fontSize: 14, color: '#888', textAlign: 'center',
    lineHeight: 20, marginBottom: 24,
  },
  buttons: { width: '100%', gap: 10 },
  button: {
    backgroundColor: '#7C3AED', borderRadius: 12,
    padding: 14, alignItems: 'center',
  },
  buttonMargin: { marginTop: 0 },
  destructiveButton: { backgroundColor: '#FF6B6B22', borderWidth: 1, borderColor: '#FF6B6B' },
  cancelButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#333' },
  buttonText: { color: 'white', fontSize: 15, fontWeight: '600' },
  destructiveText: { color: '#FF6B6B' },
  cancelText: { color: '#888' },
});