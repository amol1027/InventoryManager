import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 64) / 3; // 3 images per row with padding
const MAX_IMAGES = 5;

interface MultiImagePickerProps {
    images: string[];
    onImagesChange: (images: string[]) => void;
    maxImages?: number;
}

const MultiImagePicker: React.FC<MultiImagePickerProps> = ({
    images,
    onImagesChange,
    maxImages = MAX_IMAGES,
}) => {
    const { colors } = useTheme();
    const styles = getStyles(colors);

    const handleAddImage = () => {
        if (images.length >= maxImages) {
            Alert.alert('Limit Reached', `You can only add up to ${maxImages} images.`);
            return;
        }

        Alert.alert('Select Image Source', 'Choose where to get the image from', [
            {
                text: 'Camera',
                onPress: () => {
                    launchCamera({ mediaType: 'photo', includeBase64: false }, (response) => {
                        if (!response.didCancel && !response.errorCode && response.assets?.[0]?.uri) {
                            onImagesChange([...images, response.assets[0].uri]);
                        }
                    });
                },
            },
            {
                text: 'Gallery',
                onPress: () => {
                    launchImageLibrary(
                        {
                            mediaType: 'photo',
                            includeBase64: false,
                            selectionLimit: maxImages - images.length,
                        },
                        (response) => {
                            if (!response.didCancel && !response.errorCode && response.assets) {
                                const newImages = response.assets.map((asset) => asset.uri!).filter(Boolean);
                                onImagesChange([...images, ...newImages]);
                            }
                        }
                    );
                },
            },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const handleRemoveImage = (index: number) => {
        Alert.alert('Remove Image', 'Are you sure you want to remove this image?', [
            {
                text: 'Cancel',
                style: 'cancel',
            },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                    const newImages = images.filter((_, i) => i !== index);
                    onImagesChange(newImages);
                },
            },
        ]);
    };

    const handleSetPrimary = (index: number) => {
        if (index === 0) return; // Already primary
        const newImages = [...images];
        const [primaryImage] = newImages.splice(index, 1);
        newImages.unshift(primaryImage);
        onImagesChange(newImages);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.label}>Product Images</Text>
                <Text style={styles.count}>
                    {images.length}/{maxImages}
                </Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {images.map((uri, index) => (
                    <Animated.View
                        key={`${uri}-${index}`}
                        entering={FadeInDown.delay(index * 50).springify()}
                        style={styles.imageContainer}
                    >
                        <Image source={{ uri }} style={styles.image} resizeMode="cover" />

                        {index === 0 && (
                            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                                <Icon name="star" size={12} color="#fff" />
                                <Text style={styles.badgeText}>Primary</Text>
                            </View>
                        )}

                        <View style={styles.imageActions}>
                            {index !== 0 && (
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                                    onPress={() => handleSetPrimary(index)}
                                >
                                    <Icon name="star-border" size={16} color="#fff" />
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: colors.error }]}
                                onPress={() => handleRemoveImage(index)}
                            >
                                <Icon name="close" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                ))}

                {images.length < maxImages && (
                    <TouchableOpacity style={styles.addButton} onPress={handleAddImage}>
                        <Icon name="add-a-photo" size={32} color={colors.text.secondary} />
                        <Text style={styles.addButtonText}>Add Image</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {images.length === 0 && (
                <View style={styles.emptyState}>
                    <Icon name="image" size={48} color={colors.text.disabled} />
                    <Text style={styles.emptyText}>No images added yet</Text>
                    <Text style={styles.emptySubtext}>Tap "Add Image" to get started</Text>
                </View>
            )}
        </View>
    );
};

const getStyles = (colors: any) =>
    StyleSheet.create({
        container: {
            marginTop: 8,
            marginBottom: 16,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
        },
        label: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text.primary,
        },
        count: {
            fontSize: 14,
            color: colors.text.secondary,
            fontWeight: '500',
        },
        scrollContent: {
            paddingRight: 16,
        },
        imageContainer: {
            width: IMAGE_SIZE,
            height: IMAGE_SIZE,
            marginRight: 12,
            borderRadius: 12,
            overflow: 'hidden',
            position: 'relative',
        },
        image: {
            width: '100%',
            height: '100%',
        },
        badge: {
            position: 'absolute',
            top: 8,
            left: 8,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 6,
            paddingVertical: 3,
            borderRadius: 8,
            gap: 4,
        },
        badgeText: {
            color: '#fff',
            fontSize: 10,
            fontWeight: '600',
        },
        imageActions: {
            position: 'absolute',
            bottom: 8,
            right: 8,
            flexDirection: 'row',
            gap: 6,
        },
        actionButton: {
            width: 28,
            height: 28,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
        },
        addButton: {
            width: IMAGE_SIZE,
            height: IMAGE_SIZE,
            borderRadius: 12,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: colors.border,
            backgroundColor: colors.surface,
            justifyContent: 'center',
            alignItems: 'center',
        },
        addButtonText: {
            marginTop: 8,
            fontSize: 12,
            color: colors.text.secondary,
            fontWeight: '500',
        },
        emptyState: {
            alignItems: 'center',
            padding: 32,
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            marginTop: 8,
        },
        emptyText: {
            marginTop: 12,
            fontSize: 16,
            fontWeight: '600',
            color: colors.text.primary,
        },
        emptySubtext: {
            marginTop: 4,
            fontSize: 14,
            color: colors.text.secondary,
        },
    });

export default MultiImagePicker;
