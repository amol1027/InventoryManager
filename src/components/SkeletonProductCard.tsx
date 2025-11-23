import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

const SkeletonProductCard = () => {
    const { colors } = useTheme();
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 1000 }),
                withTiming(0.3, { duration: 1000 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const styles = getStyles(colors);

    return (
        <View style={styles.card}>
            <View style={styles.contentContainer}>
                {/* Image Skeleton */}
                <Animated.View style={[styles.imageSkeleton, animatedStyle]} />

                <View style={styles.infoContainer}>
                    {/* Title & Category Skeleton */}
                    <View style={styles.headerRow}>
                        <Animated.View style={[styles.titleSkeleton, animatedStyle]} />
                        <Animated.View style={[styles.badgeSkeleton, animatedStyle]} />
                    </View>

                    {/* Price & Stock Skeleton */}
                    <View style={styles.detailsRow}>
                        <View>
                            <Animated.View style={[styles.priceSkeleton, animatedStyle]} />
                            <Animated.View style={[styles.gstSkeleton, animatedStyle]} />
                        </View>
                        <Animated.View style={[styles.stockSkeleton, animatedStyle]} />
                    </View>
                </View>
            </View>
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        height: 106, // Match ProductCard approximate height
    },
    contentContainer: {
        flexDirection: 'row',
        padding: 12,
    },
    imageSkeleton: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: colors.border,
        marginRight: 16,
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    titleSkeleton: {
        height: 16,
        width: '60%',
        backgroundColor: colors.border,
        borderRadius: 4,
    },
    badgeSkeleton: {
        height: 16,
        width: 60,
        backgroundColor: colors.border,
        borderRadius: 6,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    priceSkeleton: {
        height: 20,
        width: 80,
        backgroundColor: colors.border,
        borderRadius: 4,
        marginBottom: 4,
    },
    gstSkeleton: {
        height: 12,
        width: 100,
        backgroundColor: colors.border,
        borderRadius: 4,
    },
    stockSkeleton: {
        height: 24,
        width: 70,
        backgroundColor: colors.border,
        borderRadius: 8,
    },
});

export default SkeletonProductCard;
