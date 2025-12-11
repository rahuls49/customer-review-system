'use client';

import { Star } from 'lucide-react';

interface RatingStarsProps {
    rating: number;
    maxRating?: number;
    size?: number;
}

export function RatingStars({ rating, maxRating = 5, size = 16 }: RatingStarsProps) {
    return (
        <div className="rating">
            {Array.from({ length: maxRating }, (_, i) => (
                <Star
                    key={i}
                    size={size}
                    className={`rating-star ${i < rating ? 'rating-star--filled' : 'rating-star--empty'}`}
                    fill={i < rating ? 'currentColor' : 'none'}
                />
            ))}
        </div>
    );
}
