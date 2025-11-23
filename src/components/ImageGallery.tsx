import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Modal,
    Dimensions,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

interface ImageGalleryProps {
    images: string[];
    primaryIndex?: number;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, primaryIndex = 0 }) => {
    const { colors } = useTheme();
    const styles = getStyles(colors);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [fullScreenVisible, setFullScreenVisible] = useState(false);

    if (images.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Icon name="image" size={64} color={colors.text.disabled} />
                <Text style={styles.emptyText}>No images available</Text>
            </View>
        );
    }

    const handleImagePress = (index: number) => {
        setSelectedIndex(index);
        setFullScreenVisible(true);
    };

    return (
        <View style={styles.container}>
            {/* Main Image */}
            <TouchableOpacity
                style={styles.mainImageContainer}
                onPress={() => handleImagePress(selectedIndex)}
                activeOpacity={0.9}
            >
                <Image
                    source={{ uri: images[selectedIndex] }}
                    style={styles.mainImage}
                    resizeMode="cover"
                />
                {selectedIndex === primaryIndex && (
                    <View style={[styles.primaryBadge, { backgroundColor: colors.primary }]}>
                        <Icon name="star" size={16} color="#fff" />
                        <Text style={styles.primaryText}>Primary</Text>
                    </View>
                )}
                <View style={styles.imageCounter}>
                    <Text style={styles.counterText}>
                        {selectedIndex + 1} / {images.length}
                    </Text>
                </View>
            </TouchableOpacity>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.thumbnailStrip}
                >
                    {images.map((uri, index) => (
                        <TouchableOpacity
                            key={`thumb-${index}`}
                            style={[
                                styles.thumbnail,
                                selectedIndex === index && {
                                    borderColor: colors.primary,
                                    borderWidth: 3,
                                },
                            ]}
                            onPress={() => setSelectedIndex(index)}
                        >
                            <Image source={{ uri }} style={styles.thumbnailImage} resizeMode="cover" />
                            {index === primaryIndex && (
                                <View style={styles.thumbnailBadge}>
                                    <Icon name="star" size={12} color={colors.primary} />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {/* Full Screen Modal */}
            <Modal
                visible={fullScreenVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setFullScreenVisible(false)}
            >
                <Animated.View
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={styles.modalContainer}
                >
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setFullScreenVisible(false)}
                    >
                        <Icon name="close" size={32} color="#fff" />
                    </TouchableOpacity>

                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(event) => {
                            const index = Math.round(event.nativeEvent.contentOffset.x / width);
                            setSelectedIndex(index);
                        }}
                        contentOffset={{ x: selectedIndex * width, y: 0 }}
                    >
                        {images.map((uri, index) => (
                            <View key={`full-${index}`} style={styles.fullImageContainer}>
                                <Image
                                    source={{ uri }}
                                    style={styles.fullImage}
                                    resizeMode="contain"
                                />
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.fullScreenCounter}>
                        <Text style={styles.fullScreenCounterText}>
                            {selectedIndex + 1} / {images.length}
                        </Text>
                    </View>
                </Animated.View>
            </Modal>
        </View>
    );
};

const getStyles = (colors: any) =>
    StyleSheet.create({
        container: {
            marginBottom: 16,
        },
        mainImageContainer: {
            width: '100%',
            height: 300,
            borderRadius: 16,
            overflow: 'hidden',
            backgroundColor: colors.surface,
            position: 'relative',
        },
        mainImage: {
            width: '100%',
            height: '100%',
        },
        primaryBadge: {
            position: 'absolute',
            top: 16,
            left: 16,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 20,
            gap: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
        },
        primaryText: {
            color: '#fff',
            fontSize: 12,
            fontWeight: '600',
        },
        imageCounter: {
            position: 'absolute',
            bottom: 16,
            right: 16,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
        },
        counterText: {
            color: '#fff',
            fontSize: 12,
            fontWeight: '600',
        },
        thumbnailStrip: {
            paddingTop: 12,
            paddingBottom: 4,
            gap: 8,
        },
        thumbnail: {
            width: 80,
            height: 80,
            borderRadius: 12,
            overflow: 'hidden',
            marginRight: 8,
            borderWidth: 2,
            borderColor: colors.border,
            position: 'relative',
        },
        thumbnailImage: {
            width: '100%',
            height: '100%',
        },
        thumbnailBadge: {
            position: 'absolute',
            top: 4,
            right: 4,
            backgroundColor: '#fff',
            borderRadius: 10,
            padding: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 2,
            elevation: 2,
        },
        emptyContainer: {
            height: 300,
            borderRadius: 16,
            backgroundColor: colors.surface,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: colors.border,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
        },
        emptyText: {
            marginTop: 12,
            fontSize: 16,
            color: colors.text.secondary,
            fontWeight: '500',
        },
        modalContainer: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        closeButton: {
            position: 'absolute',
            top: 40,
            right: 20,
            zIndex: 10,
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        fullImageContainer: {
            width,
            height,
            justifyContent: 'center',
            alignItems: 'center',
        },
        fullImage: {
            width: width,
            height: height * 0.8,
        },
        fullScreenCounter: {
            position: 'absolute',
            bottom: 40,
            alignSelf: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
        },
        fullScreenCounterText: {
            color: '#fff',
            fontSize: 14,
            fontWeight: '600',
        },
    });

export default ImageGallery;
