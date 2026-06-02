import React from 'react';
export interface Settings {
    /**
     * Rotation of the book, in degrees.
     */
    rotate: number;
    /**
     * Rotation of the book on hover, in degrees.
     */
    rotateHover: number;
    /**
     * Perspective value. 600 seems to be a realistic value.
     */
    perspective: number;
    /**
     * Duration of rotate animation, in milliseconds.
     */
    transitionDuration: number;
    /**
     * Radius of right corners, in pixels.
     */
    radius: number;
    /**
     * Book thickness, in pixels.
     */
    thickness: number;
    /**
     * Color of the inside of back cover.
     */
    bgColor: string;
    /**
     * Color of box shadow.
     */
    shadowColor: string;
    /**
     * Width of the book, in pixels.
     */
    width: number;
    /**
     * Height of the book, in pixels.
     */
    height: number;
    /**
     * Offset between the pages and the cover size, in pixels.
     */
    pagesOffset: number;
}
export interface Props extends Partial<Settings> {
    children: React.ReactNode;
}
/**
 * `BookCover` is the component you can use to display an animated 3D version of your book cover.
 */
export declare const BookCover: ({ children, rotate, rotateHover, perspective, transitionDuration, radius, thickness, bgColor, shadowColor, width, height, pagesOffset, }: Props) => JSX.Element;
export declare const getCssForSettings: (uniqueId: string, settings: Settings) => string;
