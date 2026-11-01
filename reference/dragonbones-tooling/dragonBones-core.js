/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * @private
     */
    class DragonBones {
        constructor(eventManager) {
            this._clock = new dragonBones.WorldClock();
            this._events = [];
            this._objects = [];
            this._eventManager = null;
            this._eventManager = eventManager;
            console.info(`DragonBones: ${DragonBones.VERSION}\nWebsite: http://dragonbones.com/\nSource and Demos: https://github.com/DragonBones/`);
        }
        advanceTime(passedTime) {
            if (this._objects.length > 0) {
                for (const object of this._objects) {
                    object.returnToPool();
                }
                this._objects.length = 0;
            }
            this._clock.advanceTime(passedTime);
            if (this._events.length > 0) {
                for (let i = 0; i < this._events.length; ++i) {
                    const eventObject = this._events[i];
                    const armature = eventObject.armature;
                    if (armature._armatureData !== null) { // May be armature disposed before advanceTime.
                        armature.eventDispatcher.dispatchDBEvent(eventObject.type, eventObject);
                        if (eventObject.type === dragonBones.EventObject.SOUND_EVENT) {
                            this._eventManager.dispatchDBEvent(eventObject.type, eventObject);
                        }
                    }
                    this.bufferObject(eventObject);
                }
                this._events.length = 0;
            }
        }
        bufferEvent(value) {
            if (this._events.indexOf(value) < 0) {
                this._events.push(value);
            }
        }
        bufferObject(object) {
            if (this._objects.indexOf(object) < 0) {
                this._objects.push(object);
            }
        }
        get clock() {
            return this._clock;
        }
        get eventManager() {
            return this._eventManager;
        }
    }
    DragonBones.VERSION = "5.6.2";
    DragonBones.yDown = true;
    DragonBones.debug = false;
    DragonBones.debugDraw = false;
    DragonBones.webAssembly = false;
    dragonBones.DragonBones = DragonBones;
    if (!console.warn) {
        console.warn = function () { };
    }
    if (!console.assert) {
        console.assert = function () { };
    }
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * - The BaseObject is the base class for all objects in the DragonBones framework.
     * All BaseObject instances are cached to the object pool to reduce the performance consumption of frequent requests for memory or memory recovery.
     * @version DragonBones 4.5
     * @language en_US
     */
    /**
     * - 基础对象，通常 DragonBones 的对象都继承自该类。
     * 所有基础对象的实例都会缓存到对象池，以减少频繁申请内存或内存回收的性能消耗。
     * @version DragonBones 4.5
     * @language zh_CN
     */
    class BaseObject {
        constructor() {
            /**
             * - A unique identification number assigned to the object.
             * @version DragonBones 4.5
             * @language en_US
             */
            /**
             * - 分配给此实例的唯一标识号。
             * @version DragonBones 4.5
             * @language zh_CN
             */
            this.hashCode = BaseObject._hashCode++;
            this._isInPool = false;
        }
        static _returnObject(object) {
            const classType = String(object.constructor);
            const maxCount = classType in BaseObject._maxCountMap ? BaseObject._maxCountMap[classType] : BaseObject._defaultMaxCount;
            const pool = BaseObject._poolsMap[classType] = BaseObject._poolsMap[classType] || [];
            if (pool.length < maxCount) {
                if (!object._isInPool) {
                    object._isInPool = true;
                    pool.push(object);
                }
                else {
                    console.warn("The object is already in the pool.");
                }
            }
            else {
            }
        }
        static toString() {
            throw new Error();
        }
        /**
         * - Set the maximum cache count of the specify object pool.
         * @param objectConstructor - The specify class. (Set all object pools max cache count if not set)
         * @param maxCount - Max count.
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 设置特定对象池的最大缓存数量。
         * @param objectConstructor - 特定的类。 (不设置则设置所有对象池的最大缓存数量)
         * @param maxCount - 最大缓存数量。
         * @version DragonBones 4.5
         * @language zh_CN
         */
        static setMaxCount(objectConstructor, maxCount) {
            if (maxCount < 0 || maxCount !== maxCount) { // isNaN
                maxCount = 0;
            }
            if (objectConstructor !== null) {
                const classType = String(objectConstructor);
                const pool = classType in BaseObject._poolsMap ? BaseObject._poolsMap[classType] : null;
                if (pool !== null && pool.length > maxCount) {
                    pool.length = maxCount;
                }
                BaseObject._maxCountMap[classType] = maxCount;
            }
            else {
                BaseObject._defaultMaxCount = maxCount;
                for (let classType in BaseObject._poolsMap) {
                    const pool = BaseObject._poolsMap[classType];
                    if (pool.length > maxCount) {
                        pool.length = maxCount;
                    }
                    if (classType in BaseObject._maxCountMap) {
                        BaseObject._maxCountMap[classType] = maxCount;
                    }
                }
            }
        }
        /**
         * - Clear the cached instances of a specify object pool.
         * @param objectConstructor - Specify class. (Clear all cached instances if not set)
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 清除特定对象池的缓存实例。
         * @param objectConstructor - 特定的类。 (不设置则清除所有缓存的实例)
         * @version DragonBones 4.5
         * @language zh_CN
         */
        static clearPool(objectConstructor = null) {
            if (objectConstructor !== null) {
                const classType = String(objectConstructor);
                const pool = classType in BaseObject._poolsMap ? BaseObject._poolsMap[classType] : null;
                if (pool !== null && pool.length > 0) {
                    pool.length = 0;
                }
            }
            else {
                for (let k in BaseObject._poolsMap) {
                    const pool = BaseObject._poolsMap[k];
                    pool.length = 0;
                }
            }
        }
        /**
         * - Get an instance of the specify class from object pool.
         * @param objectConstructor - The specify class.
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 从对象池中获取特定类的实例。
         * @param objectConstructor - 特定的类。
         * @version DragonBones 4.5
         * @language zh_CN
         */
        static borrowObject(objectConstructor) {
            const classType = String(objectConstructor);
            const pool = classType in BaseObject._poolsMap ? BaseObject._poolsMap[classType] : null;
            if (pool !== null && pool.length > 0) {
                const object = pool.pop();
                object._isInPool = false;
                return object;
            }
            const object = new objectConstructor();
            object._onClear();
            return object;
        }
        /**
         * - Clear the object and return it back to object pool。
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 清除该实例的所有数据并将其返还对象池。
         * @version DragonBones 4.5
         * @language zh_CN
         */
        returnToPool() {
            this._onClear();
            BaseObject._returnObject(this);
        }
    }
    BaseObject._hashCode = 0;
    BaseObject._defaultMaxCount = 3000;
    BaseObject._maxCountMap = {};
    BaseObject._poolsMap = {};
    dragonBones.BaseObject = BaseObject;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * @internal
     * @private
     */
    class ColorTransform {
        constructor(alphaMultiplier = 1.0, redMultiplier = 1.0, greenMultiplier = 1.0, blueMultiplier = 1.0, alphaOffset = 0, redOffset = 0, greenOffset = 0, blueOffset = 0) {
            this.alphaMultiplier = alphaMultiplier;
            this.redMultiplier = redMultiplier;
            this.greenMultiplier = greenMultiplier;
            this.blueMultiplier = blueMultiplier;
            this.alphaOffset = alphaOffset;
            this.redOffset = redOffset;
            this.greenOffset = greenOffset;
            this.blueOffset = blueOffset;
        }
        copyFrom(value) {
            this.alphaMultiplier = value.alphaMultiplier;
            this.redMultiplier = value.redMultiplier;
            this.greenMultiplier = value.greenMultiplier;
            this.blueMultiplier = value.blueMultiplier;
            this.alphaOffset = value.alphaOffset;
            this.redOffset = value.redOffset;
            this.greenOffset = value.greenOffset;
            this.blueOffset = value.blueOffset;
        }
        identity() {
            this.alphaMultiplier = this.redMultiplier = this.greenMultiplier = this.blueMultiplier = 1.0;
            this.alphaOffset = this.redOffset = this.greenOffset = this.blueOffset = 0;
        }
    }
    dragonBones.ColorTransform = ColorTransform;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * - 2D Transform matrix.
     * @version DragonBones 3.0
     * @language en_US
     */
    /**
     * - 2D 转换矩阵。
     * @version DragonBones 3.0
     * @language zh_CN
     */
    class Matrix {
        /**
         * @private
         */
        constructor(a = 1.0, b = 0.0, c = 0.0, d = 1.0, tx = 0.0, ty = 0.0) {
            this.a = a;
            this.b = b;
            this.c = c;
            this.d = d;
            this.tx = tx;
            this.ty = ty;
        }
        toString() {
            return "[object dragonBones.Matrix] a:" + this.a + " b:" + this.b + " c:" + this.c + " d:" + this.d + " tx:" + this.tx + " ty:" + this.ty;
        }
        /**
         * @private
         */
        copyFrom(value) {
            this.a = value.a;
            this.b = value.b;
            this.c = value.c;
            this.d = value.d;
            this.tx = value.tx;
            this.ty = value.ty;
            return this;
        }
        /**
         * @private
         */
        copyFromArray(value, offset = 0) {
            this.a = value[offset];
            this.b = value[offset + 1];
            this.c = value[offset + 2];
            this.d = value[offset + 3];
            this.tx = value[offset + 4];
            this.ty = value[offset + 5];
            return this;
        }
        /**
         * - Convert to unit matrix.
         * The resulting matrix has the following properties: a=1, b=0, c=0, d=1, tx=0, ty=0.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 转换为单位矩阵。
         * 该矩阵具有以下属性：a=1、b=0、c=0、d=1、tx=0、ty=0。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        identity() {
            this.a = this.d = 1.0;
            this.b = this.c = 0.0;
            this.tx = this.ty = 0.0;
            return this;
        }
        /**
         * - Multiplies the current matrix with another matrix.
         * @param value - The matrix that needs to be multiplied.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 将当前矩阵与另一个矩阵相乘。
         * @param value - 需要相乘的矩阵。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        concat(value) {
            let aA = this.a * value.a;
            let bA = 0.0;
            let cA = 0.0;
            let dA = this.d * value.d;
            let txA = this.tx * value.a + value.tx;
            let tyA = this.ty * value.d + value.ty;
            if (this.b !== 0.0 || this.c !== 0.0) {
                aA += this.b * value.c;
                bA += this.b * value.d;
                cA += this.c * value.a;
                dA += this.c * value.b;
            }
            if (value.b !== 0.0 || value.c !== 0.0) {
                bA += this.a * value.b;
                cA += this.d * value.c;
                txA += this.ty * value.c;
                tyA += this.tx * value.b;
            }
            this.a = aA;
            this.b = bA;
            this.c = cA;
            this.d = dA;
            this.tx = txA;
            this.ty = tyA;
            return this;
        }
        /**
         * - Convert to inverse matrix.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 转换为逆矩阵。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        invert() {
            let aA = this.a;
            let bA = this.b;
            let cA = this.c;
            let dA = this.d;
            const txA = this.tx;
            const tyA = this.ty;
            if (bA === 0.0 && cA === 0.0) {
                this.b = this.c = 0.0;
                if (aA === 0.0 || dA === 0.0) {
                    this.a = this.b = this.tx = this.ty = 0.0;
                }
                else {
                    aA = this.a = 1.0 / aA;
                    dA = this.d = 1.0 / dA;
                    this.tx = -aA * txA;
                    this.ty = -dA * tyA;
                }
                return this;
            }
            let determinant = aA * dA - bA * cA;
            if (determinant === 0.0) {
                this.a = this.d = 1.0;
                this.b = this.c = 0.0;
                this.tx = this.ty = 0.0;
                return this;
            }
            determinant = 1.0 / determinant;
            let k = this.a = dA * determinant;
            bA = this.b = -bA * determinant;
            cA = this.c = -cA * determinant;
            dA = this.d = aA * determinant;
            this.tx = -(k * txA + cA * tyA);
            this.ty = -(bA * txA + dA * tyA);
            return this;
        }
        /**
         * - Apply a matrix transformation to a specific point.
         * @param x - X coordinate.
         * @param y - Y coordinate.
         * @param result - The point after the transformation is applied.
         * @param delta - Whether to ignore tx, ty's conversion to point.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 将矩阵转换应用于特定点。
         * @param x - 横坐标。
         * @param y - 纵坐标。
         * @param result - 应用转换之后的点。
         * @param delta - 是否忽略 tx，ty 对点的转换。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        transformPoint(x, y, result, delta = false) {
            result.x = this.a * x + this.c * y;
            result.y = this.b * x + this.d * y;
            if (!delta) {
                result.x += this.tx;
                result.y += this.ty;
            }
        }
        /**
         * @private
         */
        transformRectangle(rectangle, delta = false) {
            const a = this.a;
            const b = this.b;
            const c = this.c;
            const d = this.d;
            const tx = delta ? 0.0 : this.tx;
            const ty = delta ? 0.0 : this.ty;
            const x = rectangle.x;
            const y = rectangle.y;
            const xMax = x + rectangle.width;
            const yMax = y + rectangle.height;
            let x0 = a * x + c * y + tx;
            let y0 = b * x + d * y + ty;
            let x1 = a * xMax + c * y + tx;
            let y1 = b * xMax + d * y + ty;
            let x2 = a * xMax + c * yMax + tx;
            let y2 = b * xMax + d * yMax + ty;
            let x3 = a * x + c * yMax + tx;
            let y3 = b * x + d * yMax + ty;
            let tmp = 0.0;
            if (x0 > x1) {
                tmp = x0;
                x0 = x1;
                x1 = tmp;
            }
            if (x2 > x3) {
                tmp = x2;
                x2 = x3;
                x3 = tmp;
            }
            rectangle.x = Math.floor(x0 < x2 ? x0 : x2);
            rectangle.width = Math.ceil((x1 > x3 ? x1 : x3) - rectangle.x);
            if (y0 > y1) {
                tmp = y0;
                y0 = y1;
                y1 = tmp;
            }
            if (y2 > y3) {
                tmp = y2;
                y2 = y3;
                y3 = tmp;
            }
            rectangle.y = Math.floor(y0 < y2 ? y0 : y2);
            rectangle.height = Math.ceil((y1 > y3 ? y1 : y3) - rectangle.y);
        }
    }
    dragonBones.Matrix = Matrix;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * - The Point object represents a location in a two-dimensional coordinate system.
     * @version DragonBones 3.0
     * @language en_US
     */
    /**
     * - Point 对象表示二维坐标系统中的某个位置。
     * @version DragonBones 3.0
     * @language zh_CN
     */
    class Point {
        /**
         * - Creates a new point. If you pass no parameters to this method, a point is created at (0,0).
         * @param x - The horizontal coordinate.
         * @param y - The vertical coordinate.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 创建一个 egret.Point 对象.若不传入任何参数，将会创建一个位于（0，0）位置的点。
         * @param x - 该对象的x属性值，默认为 0.0。
         * @param y - 该对象的y属性值，默认为 0.0。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        constructor(x = 0.0, y = 0.0) {
            this.x = x;
            this.y = y;
        }
        /**
         * @private
         */
        copyFrom(value) {
            this.x = value.x;
            this.y = value.y;
        }
        /**
         * @private
         */
        clear() {
            this.x = this.y = 0.0;
        }
    }
    dragonBones.Point = Point;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * - A Rectangle object is an area defined by its position, as indicated by its top-left corner point (x, y) and by its
     * width and its height.<br/>
     * The x, y, width, and height properties of the Rectangle class are independent of each other; changing the value of
     * one property has no effect on the others. However, the right and bottom properties are integrally related to those
     * four properties. For example, if you change the value of the right property, the value of the width property changes;
     * if you change the bottom property, the value of the height property changes.
     * @version DragonBones 3.0
     * @language en_US
     */
    /**
     * - Rectangle 对象是按其位置（由它左上角的点 (x, y) 确定）以及宽度和高度定义的区域。<br/>
     * Rectangle 类的 x、y、width 和 height 属性相互独立；更改一个属性的值不会影响其他属性。
     * 但是，right 和 bottom 属性与这四个属性是整体相关的。例如，如果更改 right 属性的值，则 width
     * 属性的值将发生变化；如果更改 bottom 属性，则 height 属性的值将发生变化。
     * @version DragonBones 3.0
     * @language zh_CN
     */
    class Rectangle {
        /**
         * @private
         */
        constructor(x = 0.0, y = 0.0, width = 0.0, height = 0.0) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
        /**
         * @private
         */
        copyFrom(value) {
            this.x = value.x;
            this.y = value.y;
            this.width = value.width;
            this.height = value.height;
        }
        /**
         * @private
         */
        clear() {
            this.x = this.y = 0.0;
            this.width = this.height = 0.0;
        }
    }
    dragonBones.Rectangle = Rectangle;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * - 2D Transform.
     * @version DragonBones 3.0
     * @language en_US
     */
    /**
     * - 2D 变换。
     * @version DragonBones 3.0
     * @language zh_CN
     */
    class Transform {
        /**
         * @private
         */
        static normalizeRadian(value) {
            value = (value + Math.PI) % (Math.PI * 2.0);
            value += value > 0.0 ? -Math.PI : Math.PI;
            return value;
        }
        /**
         * @private
         */
        constructor(x = 0.0, y = 0.0, skew = 0.0, rotation = 0.0, scaleX = 1.0, scaleY = 1.0) {
            this.x = x;
            this.y = y;
            this.skew = skew;
            this.rotation = rotation;
            this.scaleX = scaleX;
            this.scaleY = scaleY;
        }
        toString() {
            return "[object dragonBones.Transform] x:" + this.x + " y:" + this.y + " skewX:" + this.skew * 180.0 / Math.PI + " skewY:" + this.rotation * 180.0 / Math.PI + " scaleX:" + this.scaleX + " scaleY:" + this.scaleY;
        }
        /**
         * @private
         */
        copyFrom(value) {
            this.x = value.x;
            this.y = value.y;
            this.skew = value.skew;
            this.rotation = value.rotation;
            this.scaleX = value.scaleX;
            this.scaleY = value.scaleY;
            return this;
        }
        /**
         * @private
         */
        identity() {
            this.x = this.y = 0.0;
            this.skew = this.rotation = 0.0;
            this.scaleX = this.scaleY = 1.0;
            return this;
        }
        /**
         * @private
         */
        add(value) {
            this.x += value.x;
            this.y += value.y;
            this.skew += value.skew;
            this.rotation += value.rotation;
            this.scaleX *= value.scaleX;
            this.scaleY *= value.scaleY;
            return this;
        }
        /**
         * @private
         */
        minus(value) {
            this.x -= value.x;
            this.y -= value.y;
            this.skew -= value.skew;
            this.rotation -= value.rotation;
            this.scaleX /= value.scaleX;
            this.scaleY /= value.scaleY;
            return this;
        }
        /**
         * @private
         */
        fromMatrix(matrix) {
            const backupScaleX = this.scaleX, backupScaleY = this.scaleY;
            const PI_Q = Transform.PI_Q;
            this.x = matrix.tx;
            this.y = matrix.ty;
            this.rotation = Math.atan(matrix.b / matrix.a);
            let skewX = Math.atan(-matrix.c / matrix.d);
            this.scaleX = (this.rotation > -PI_Q && this.rotation < PI_Q) ? matrix.a / Math.cos(this.rotation) : matrix.b / Math.sin(this.rotation);
            this.scaleY = (skewX > -PI_Q && skewX < PI_Q) ? matrix.d / Math.cos(skewX) : -matrix.c / Math.sin(skewX);
            if (backupScaleX >= 0.0 && this.scaleX < 0.0) {
                this.scaleX = -this.scaleX;
                this.rotation = this.rotation - Math.PI;
            }
            if (backupScaleY >= 0.0 && this.scaleY < 0.0) {
                this.scaleY = -this.scaleY;
                skewX = skewX - Math.PI;
            }
            this.skew = skewX - this.rotation;
            return this;
        }
        /**
         * @private
         */
        toMatrix(matrix) {
            if (this.rotation === 0.0) {
                matrix.a = 1.0;
                matrix.b = 0.0;
            }
            else {
                matrix.a = Math.cos(this.rotation);
                matrix.b = Math.sin(this.rotation);
            }
            if (this.skew === 0.0) {
                matrix.c = -matrix.b;
                matrix.d = matrix.a;
            }
            else {
                matrix.c = -Math.sin(this.skew + this.rotation);
                matrix.d = Math.cos(this.skew + this.rotation);
            }
            if (this.scaleX !== 1.0) {
                matrix.a *= this.scaleX;
                matrix.b *= this.scaleX;
            }
            if (this.scaleY !== 1.0) {
                matrix.c *= this.scaleY;
                matrix.d *= this.scaleY;
            }
            matrix.tx = this.x;
            matrix.ty = this.y;
            return this;
        }
    }
    /**
     * @private
     */
    Transform.PI = Math.PI;
    /**
     * @private
     */
    Transform.PI_D = Math.PI * 2.0;
    /**
     * @private
     */
    Transform.PI_H = Math.PI / 2.0;
    /**
     * @private
     */
    Transform.PI_Q = Math.PI / 4.0;
    /**
     * @private
     */
    Transform.RAD_DEG = 180.0 / Math.PI;
    /**
     * @private
     */
    Transform.DEG_RAD = Math.PI / 180.0;
    dragonBones.Transform = Transform;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * - The animation config is used to describe all the information needed to play an animation state.
     * The API is still in the experimental phase and may encounter bugs or stability or compatibility issues when used.
     * @see dragonBones.AnimationState
     * @beta
     * @version DragonBones 5.0
     * @language en_US
     */
    /**
     * - 动画配置用来描述播放一个动画状态所需要的全部信息。
     * 该 API 仍在实验阶段，使用时可能遭遇 bug 或稳定性或兼容性问题。
     * @see dragonBones.AnimationState
     * @beta
     * @version DragonBones 5.0
     * @language zh_CN
     */
    class AnimationConfig extends dragonBones.BaseObject {
        constructor() {
            super(...arguments);
            /**
             * @private
             */
            this.boneMask = [];
        }
        static toString() {
            return "[class dragonBones.AnimationConfig]";
        }
        /**
         * @private
         */
        _onClear() {
            this.pauseFadeOut = true;
            this.fadeOutMode = 4 /* AnimationFadeOutMode.All */;
            this.fadeOutTweenType = 1 /* TweenType.Line */;
            this.fadeOutTime = -1.0;
            this.actionEnabled = true;
            this.additiveBlending = false;
            this.displayControl = true;
            this.pauseFadeIn = true;
            this.resetToPose = true;
            this.fadeInTweenType = 1 /* TweenType.Line */;
            this.playTimes = -1;
            this.layer = 0;
            this.position = 0.0;
            this.duration = -1.0;
            this.timeScale = -100.0;
            this.weight = 1.0;
            this.fadeInTime = -1.0;
            this.autoFadeOutTime = -1.0;
            this.name = "";
            this.animation = "";
            this.group = "";
            this.boneMask.length = 0;
        }
        /**
         * @private
         */
        clear() {
            this._onClear();
        }
        /**
         * @private
         */
        copyFrom(value) {
            this.pauseFadeOut = value.pauseFadeOut;
            this.fadeOutMode = value.fadeOutMode;
            this.autoFadeOutTime = value.autoFadeOutTime;
            this.fadeOutTweenType = value.fadeOutTweenType;
            this.actionEnabled = value.actionEnabled;
            this.additiveBlending = value.additiveBlending;
            this.displayControl = value.displayControl;
            this.pauseFadeIn = value.pauseFadeIn;
            this.resetToPose = value.resetToPose;
            this.playTimes = value.playTimes;
            this.layer = value.layer;
            this.position = value.position;
            this.duration = value.duration;
            this.timeScale = value.timeScale;
            this.fadeInTime = value.fadeInTime;
            this.fadeOutTime = value.fadeOutTime;
            this.fadeInTweenType = value.fadeInTweenType;
            this.weight = value.weight;
            this.name = value.name;
            this.animation = value.animation;
            this.group = value.group;
            this.boneMask.length = value.boneMask.length;
            for (let i = 0, l = this.boneMask.length; i < l; ++i) {
                this.boneMask[i] = value.boneMask[i];
            }
        }
        /**
         * @private
         */
        containsBoneMask(name) {
            return this.boneMask.length === 0 || this.boneMask.indexOf(name) >= 0;
        }
        /**
         * @private
         */
        addBoneMask(armature, name, recursive = true) {
            const currentBone = armature.getBone(name);
            if (currentBone === null) {
                return;
            }
            if (this.boneMask.indexOf(name) < 0) { // Add mixing
                this.boneMask.push(name);
            }
            if (recursive) { // Add recursive mixing.
                for (const bone of armature.getBones()) {
                    if (this.boneMask.indexOf(bone.name) < 0 && currentBone.contains(bone)) {
                        this.boneMask.push(bone.name);
                    }
                }
            }
        }
        /**
         * @private
         */
        removeBoneMask(armature, name, recursive = true) {
            const index = this.boneMask.indexOf(name);
            if (index >= 0) { // Remove mixing.
                this.boneMask.splice(index, 1);
            }
            if (recursive) {
                const currentBone = armature.getBone(name);
                if (currentBone !== null) {
                    if (this.boneMask.length > 0) { // Remove recursive mixing.
                        for (const bone of armature.getBones()) {
                            const index = this.boneMask.indexOf(bone.name);
                            if (index >= 0 && currentBone.contains(bone)) {
                                this.boneMask.splice(index, 1);
                            }
                        }
                    }
                    else { // Add unrecursive mixing.
                        for (const bone of armature.getBones()) {
                            if (bone === currentBone) {
                                continue;
                            }
                            if (!currentBone.contains(bone)) {
                                this.boneMask.push(bone.name);
                            }
                        }
                    }
                }
            }
        }
    }
    dragonBones.AnimationConfig = AnimationConfig;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * - The animation data.
     * @version DragonBones 3.0
     * @language en_US
     */
    /**
     * - 动画数据。
     * @version DragonBones 3.0
     * @language zh_CN
     */
    class AnimationData extends dragonBones.BaseObject {
        constructor() {
            super(...arguments);
            /**
             * @private
             */
            this.cachedFrames = [];
            /**
             * @private
             */
            this.boneTimelines = {};
            /**
             * @private
             */
            this.surfaceTimelines = {};
            /**
             * @private
             */
            this.slotTimelines = {};
            /**
             * @private
             */
            this.constraintTimelines = {};
            /**
             * @private
             */
            this.animationTimelines = {};
            /**
             * @private
             */
            this.boneCachedFrameIndices = {};
            /**
             * @private
             */
            this.slotCachedFrameIndices = {};
            /**
             * @private
             */
            this.actionTimeline = null; // Initial value.
            /**
             * @private
             */
            this.zOrderTimeline = null; // Initial value.
        }
        static toString() {
            return "[class dragonBones.AnimationData]";
        }
        /**
         * @inheritDoc
         */
        _onClear() {
            for (let k in this.boneTimelines) {
                for (const timeline of this.boneTimelines[k]) {
                    timeline.returnToPool();
                }
                delete this.boneTimelines[k];
            }
            for (let k in this.surfaceTimelines) {
                for (const timeline of this.surfaceTimelines[k]) {
                    timeline.returnToPool();
                }
                delete this.surfaceTimelines[k];
            }
            for (let k in this.slotTimelines) {
                for (const timeline of this.slotTimelines[k]) {
                    timeline.returnToPool();
                }
                delete this.slotTimelines[k];
            }
            for (let k in this.constraintTimelines) {
                for (const timeline of this.constraintTimelines[k]) {
                    timeline.returnToPool();
                }
                delete this.constraintTimelines[k];
            }
            for (let k in this.animationTimelines) {
                for (const timeline of this.animationTimelines[k]) {
                    timeline.returnToPool();
                }
                delete this.animationTimelines[k];
            }
            for (let k in this.boneCachedFrameIndices) {
                delete this.boneCachedFrameIndices[k];
            }
            for (let k in this.slotCachedFrameIndices) {
                delete this.slotCachedFrameIndices[k];
            }
            if (this.actionTimeline !== null) {
                this.actionTimeline.returnToPool();
            }
            if (this.zOrderTimeline !== null) {
                this.zOrderTimeline.returnToPool();
            }
            this.frameIntOffset = 0;
            this.frameFloatOffset = 0;
            this.frameOffset = 0;
            this.frameCount = 0;
            this.playTimes = 0;
            this.duration = 0.0;
            this.scale = 1.0;
            this.fadeInTime = 0.0;
            this.cacheFrameRate = 0.0;
            this.name = "";
            this.cachedFrames.length = 0;
            // this.boneTimelines.clear();
            // this.surfaceTimelines.clear();
            // this.slotTimelines.clear();
            // this.constraintTimelines.clear();
            // this.animationTimelines.clear();
            // this.boneCachedFrameIndices.clear();
            // this.slotCachedFrameIndices.clear();
            this.actionTimeline = null;
            this.zOrderTimeline = null;
            this.parent = null; //
        }
        /**
         * @internal
         * @private
         */
        cacheFrames(frameRate) {
            if (this.cacheFrameRate > 0.0) { // TODO clear cache.
                return;
            }
            this.cacheFrameRate = Math.max(Math.ceil(frameRate * this.scale), 1.0);
            const cacheFrameCount = Math.ceil(this.cacheFrameRate * this.duration) + 1; // Cache one more frame.
            this.cachedFrames.length = cacheFrameCount;
            for (let i = 0, l = this.cacheFrames.length; i < l; ++i) {
                this.cachedFrames[i] = false;
            }
            for (const bone of this.parent.sortedBones) {
                const indices = new Array(cacheFrameCount);
                for (let i = 0, l = indices.length; i < l; ++i) {
                    indices[i] = -1;
                }
                this.boneCachedFrameIndices[bone.name] = indices;
            }
            for (const slot of this.parent.sortedSlots) {
                const indices = new Array(cacheFrameCount);
                for (let i = 0, l = indices.length; i < l; ++i) {
                    indices[i] = -1;
                }
                this.slotCachedFrameIndices[slot.name] = indices;
            }
        }
        /**
         * @private
         */
        addBoneTimeline(bone, timeline) {
            const timelines = bone.name in this.boneTimelines ? this.boneTimelines[bone.name] : (this.boneTimelines[bone.name] = []);
            if (timelines.indexOf(timeline) < 0) {
                timelines.push(timeline);
            }
        }
        /**
         * @private
         */
        addSurfaceTimeline(surface, timeline) {
            const timelines = surface.name in this.surfaceTimelines ? this.surfaceTimelines[surface.name] : (this.surfaceTimelines[surface.name] = []);
            if (timelines.indexOf(timeline) < 0) {
                timelines.push(timeline);
            }
        }
        /**
         * @private
         */
        addSlotTimeline(slot, timeline) {
            const timelines = slot.name in this.slotTimelines ? this.slotTimelines[slot.name] : (this.slotTimelines[slot.name] = []);
            if (timelines.indexOf(timeline) < 0) {
                timelines.push(timeline);
            }
        }
        /**
         * @private
         */
        addConstraintTimeline(constraint, timeline) {
            const timelines = constraint.name in this.constraintTimelines ? this.constraintTimelines[constraint.name] : (this.constraintTimelines[constraint.name] = []);
            if (timelines.indexOf(timeline) < 0) {
                timelines.push(timeline);
            }
        }
        /**
         * @private
         */
        addAnimationTimeline(name, timeline) {
            const timelines = name in this.animationTimelines ? this.animationTimelines[name] : (this.animationTimelines[name] = []);
            if (timelines.indexOf(timeline) < 0) {
                timelines.push(timeline);
            }
        }
        /**
         * @private
         */
        getBoneTimelines(name) {
            return name in this.boneTimelines ? this.boneTimelines[name] : null;
        }
        /**
         * @private
         */
        getSurfaceTimelines(name) {
            return name in this.surfaceTimelines ? this.surfaceTimelines[name] : null;
        }
        /**
         * @private
         */
        getSlotTimelines(name) {
            return name in this.slotTimelines ? this.slotTimelines[name] : null;
        }
        /**
         * @private
         */
        getConstraintTimelines(name) {
            return name in this.constraintTimelines ? this.constraintTimelines[name] : null;
        }
        /**
         * @private
         */
        getAnimationTimelines(name) {
            return name in this.animationTimelines ? this.animationTimelines[name] : null;
        }
        /**
         * @private
         */
        getBoneCachedFrameIndices(name) {
            return name in this.boneCachedFrameIndices ? this.boneCachedFrameIndices[name] : null;
        }
        /**
         * @private
         */
        getSlotCachedFrameIndices(name) {
            return name in this.slotCachedFrameIndices ? this.slotCachedFrameIndices[name] : null;
        }
    }
    dragonBones.AnimationData = AnimationData;
    /**
     * @internal
     * @private
     */
    class TimelineData extends dragonBones.BaseObject {
        static toString() {
            return "[class dragonBones.TimelineData]";
        }
        _onClear() {
            this.type = 10 /* TimelineType.BoneAll */;
            this.offset = 0;
            this.frameIndicesOffset = -1;
        }
    }
    dragonBones.TimelineData = TimelineData;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * - The armature data.
     * @version DragonBones 3.0
     * @language en_US
     */
    /**
     * - 骨架数据。
     * @version DragonBones 3.0
     * @language zh_CN
     */
    class ArmatureData extends dragonBones.BaseObject {
        constructor() {
            super(...arguments);
            /**
             * @private
             */
            this.aabb = new dragonBones.Rectangle();
            /**
             * - The names of all the animation data.
             * @version DragonBones 3.0
             * @language en_US
             */
            /**
             * - 所有的动画数据名称。
             * @version DragonBones 3.0
             * @language zh_CN
             */
            this.animationNames = [];
            /**
             * @private
             */
            this.sortedBones = [];
            /**
             * @private
             */
            this.sortedSlots = [];
            /**
             * @private
             */
            this.defaultActions = [];
            /**
             * @private
             */
            this.actions = [];
            /**
             * @private
             */
            this.bones = {};
            /**
             * @private
             */
            this.slots = {};
            /**
             * @private
             */
            this.constraints = {};
            /**
             * @private
             */
            this.skins = {};
            /**
             * @private
             */
            this.animations = {};
            /**
             * @private
             */
            this.canvas = null; // Initial value.
            /**
             * @private
             */
            this.userData = null; // Initial value.
        }
        static toString() {
            return "[class dragonBones.ArmatureData]";
        }
        /**
         * @inheritDoc
         */
        _onClear() {
            for (const action of this.defaultActions) {
                action.returnToPool();
            }
            for (const action of this.actions) {
                action.returnToPool();
            }
            for (let k in this.bones) {
                this.bones[k].returnToPool();
                delete this.bones[k];
            }
            for (let k in this.slots) {
                this.slots[k].returnToPool();
                delete this.slots[k];
            }
            for (let k in this.constraints) {
                this.constraints[k].returnToPool();
                delete this.constraints[k];
            }
            for (let k in this.skins) {
                this.skins[k].returnToPool();
                delete this.skins[k];
            }
            for (let k in this.animations) {
                this.animations[k].returnToPool();
                delete this.animations[k];
            }
            if (this.canvas !== null) {
                this.canvas.returnToPool();
            }
            if (this.userData !== null) {
                this.userData.returnToPool();
            }
            this.type = 0 /* ArmatureType.Armature */;
            this.frameRate = 0;
            this.cacheFrameRate = 0;
            this.scale = 1.0;
            this.name = "";
            this.aabb.clear();
            this.animationNames.length = 0;
            this.sortedBones.length = 0;
            this.sortedSlots.length = 0;
            this.defaultActions.length = 0;
            this.actions.length = 0;
            // this.bones.clear();
            // this.slots.clear();
            // this.constraints.clear();
            // this.skins.clear();
            // this.animations.clear();
            this.defaultSkin = null;
            this.defaultAnimation = null;
            this.canvas = null;
            this.userData = null;
            this.parent = null; //
        }
        /**
         * @internal
         * @private
         */
        sortBones() {
            const total = this.sortedBones.length;
            if (total <= 0) {
                return;
            }
            const sortHelper = this.sortedBones.concat();
            let index = 0;
            let count = 0;
            this.sortedBones.length = 0;
            while (count < total) {
                const bone = sortHelper[index++];
                if (index >= total) {
                    index = 0;
                }
                if (this.sortedBones.indexOf(bone) >= 0) {
                    continue;
                }
                let flag = false;
                for (let k in this.constraints) { // Wait constraint.
                    const constraint = this.constraints[k];
                    if (constraint.root === bone && this.sortedBones.indexOf(constraint.target) < 0) {
                        flag = true;
                        break;
                    }
                }
                if (flag) {
                    continue;
                }
                if (bone.parent !== null && this.sortedBones.indexOf(bone.parent) < 0) { // Wait parent.
                    continue;
                }
                this.sortedBones.push(bone);
                count++;
            }
        }
        /**
         * @internal
         * @private
         */
        cacheFrames(frameRate) {
            if (this.cacheFrameRate > 0) { // TODO clear cache.
                return;
            }
            this.cacheFrameRate = frameRate;
            for (let k in this.animations) {
                this.animations[k].cacheFrames(this.cacheFrameRate);
            }
        }
        /**
         * @internal
         * @private
         */
        setCacheFrame(globalTransformMatrix, transform) {
            const dataArray = this.parent.cachedFrames;
            let arrayOffset = dataArray.length;
            dataArray.length += 10;
            dataArray[arrayOffset] = globalTransformMatrix.a;
            dataArray[arrayOffset + 1] = globalTransformMatrix.b;
            dataArray[arrayOffset + 2] = globalTransformMatrix.c;
            dataArray[arrayOffset + 3] = globalTransformMatrix.d;
            dataArray[arrayOffset + 4] = globalTransformMatrix.tx;
            dataArray[arrayOffset + 5] = globalTransformMatrix.ty;
            dataArray[arrayOffset + 6] = transform.rotation;
            dataArray[arrayOffset + 7] = transform.skew;
            dataArray[arrayOffset + 8] = transform.scaleX;
            dataArray[arrayOffset + 9] = transform.scaleY;
            return arrayOffset;
        }
        /**
         * @internal
         * @private
         */
        getCacheFrame(globalTransformMatrix, transform, arrayOffset) {
            const dataArray = this.parent.cachedFrames;
            globalTransformMatrix.a = dataArray[arrayOffset];
            globalTransformMatrix.b = dataArray[arrayOffset + 1];
            globalTransformMatrix.c = dataArray[arrayOffset + 2];
            globalTransformMatrix.d = dataArray[arrayOffset + 3];
            globalTransformMatrix.tx = dataArray[arrayOffset + 4];
            globalTransformMatrix.ty = dataArray[arrayOffset + 5];
            transform.rotation = dataArray[arrayOffset + 6];
            transform.skew = dataArray[arrayOffset + 7];
            transform.scaleX = dataArray[arrayOffset + 8];
            transform.scaleY = dataArray[arrayOffset + 9];
            transform.x = globalTransformMatrix.tx;
            transform.y = globalTransformMatrix.ty;
        }
        /**
         * @internal
         * @private
         */
        addBone(value) {
            if (value.name in this.bones) {
                console.warn("Same bone: " + value.name);
                return;
            }
            this.bones[value.name] = value;
            this.sortedBones.push(value);
        }
        /**
         * @internal
         * @private
         */
        addSlot(value) {
            if (value.name in this.slots) {
                console.warn("Same slot: " + value.name);
                return;
            }
            this.slots[value.name] = value;
            this.sortedSlots.push(value);
        }
        /**
         * @internal
         * @private
         */
        addConstraint(value) {
            if (value.name in this.constraints) {
                console.warn("Same constraint: " + value.name);
                return;
            }
            this.constraints[value.name] = value;
        }
        /**
         * @internal
         * @private
         */
        addSkin(value) {
            if (value.name in this.skins) {
                console.warn("Same skin: " + value.name);
                return;
            }
            value.parent = this;
            this.skins[value.name] = value;
            if (this.defaultSkin === null) {
                this.defaultSkin = value;
            }
            if (value.name === "default") {
                this.defaultSkin = value;
            }
        }
        /**
         * @internal
         * @private
         */
        addAnimation(value) {
            if (value.name in this.animations) {
                console.warn("Same animation: " + value.name);
                return;
            }
            value.parent = this;
            this.animations[value.name] = value;
            this.animationNames.push(value.name);
            if (this.defaultAnimation === null) {
                this.defaultAnimation = value;
            }
        }
        /**
         * @internal
         * @private
         */
        addAction(value, isDefault) {
            if (isDefault) {
                this.defaultActions.push(value);
            }
            else {
                this.actions.push(value);
            }
        }
        /**
         * - Get a specific done data.
         * @param name - The bone name.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 获取特定的骨骼数据。
         * @param name - 骨骼名称。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        getBone(name) {
            return name in this.bones ? this.bones[name] : null;
        }
        /**
         * - Get a specific slot data.
         * @param name - The slot name.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 获取特定的插槽数据。
         * @param name - 插槽名称。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        getSlot(name) {
            return name in this.slots ? this.slots[name] : null;
        }
        /**
         * @private
         */
        getConstraint(name) {
            return name in this.constraints ? this.constraints[name] : null;
        }
        /**
         * - Get a specific skin data.
         * @param name - The skin name.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 获取特定皮肤数据。
         * @param name - 皮肤名称。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        getSkin(name) {
            return name in this.skins ? this.skins[name] : null;
        }
        /**
         * @private
         */
        getMesh(skinName, slotName, meshName) {
            const skin = this.getSkin(skinName);
            if (skin === null) {
                return null;
            }
            return skin.getDisplay(slotName, meshName);
        }
        /**
         * - Get a specific animation data.
         * @param name - The animation name.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 获取特定的动画数据。
         * @param name - 动画名称。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        getAnimation(name) {
            return name in this.animations ? this.animations[name] : null;
        }
    }
    dragonBones.ArmatureData = ArmatureData;
    /**
     * - The bone data.
     * @version DragonBones 3.0
     * @language en_US
     */
    /**
     * - 骨骼数据。
     * @version DragonBones 3.0
     * @language zh_CN
     */
    class BoneData extends dragonBones.BaseObject {
        constructor() {
            super(...arguments);
            /**
             * @private
             */
            this.transform = new dragonBones.Transform();
            /**
             * @private
             */
            this.userData = null; // Initial value.
        }
        static toString() {
            return "[class dragonBones.BoneData]";
        }
        /**
         * @inheritDoc
         */
        _onClear() {
            if (this.userData !== null) {
                this.userData.returnToPool();
            }
            this.inheritTranslation = false;
            this.inheritRotation = false;
            this.inheritScale = false;
            this.inheritReflection = false;
            this.type = 0 /* BoneType.Bone */;
            this.length = 0.0;
            this.name = "";
            this.transform.identity();
            this.userData = null;
            this.parent = null;
        }
    }
    dragonBones.BoneData = BoneData;
    /**
     * @internal
     * @private
     */
    class SurfaceData extends BoneData {
        constructor() {
            super(...arguments);
            this.vertices = [];
        }
        static toString() {
            return "[class dragonBones.SurfaceData]";
        }
        /**
         * @inheritDoc
         */
        _onClear() {
            super._onClear();
            this.type = 1 /* BoneType.Surface */;
            this.segmentX = 0;
            this.segmentY = 0;
            this.vertices.length = 0;
        }
    }
    dragonBones.SurfaceData = SurfaceData;
    /**
     * - The slot data.
     * @version DragonBones 3.0
     * @language en_US
     */
    /**
     * - 插槽数据。
     * @version DragonBones 3.0
     * @language zh_CN
     */
    class SlotData extends dragonBones.BaseObject {
        constructor() {
            super(...arguments);
            /**
             * @private
             */
            this.color = null; // Initial value.
            /**
             * @private
             */
            this.userData = null; // Initial value.
        }
        /**
         * @internal
         * @private
         */
        static createColor() {
            return new dragonBones.ColorTransform();
        }
        static toString() {
            return "[class dragonBones.SlotData]";
        }
        /**
         * @inheritDoc
         */
        _onClear() {
            if (this.userData !== null) {
                this.userData.returnToPool();
            }
            this.blendMode = 0 /* BlendMode.Normal */;
            this.displayIndex = 0;
            this.zOrder = 0;
            this.name = "";
            this.color = null; //
            this.userData = null;
            this.parent = null; //
        }
    }
    /**
     * @internal
     * @private
     */
    SlotData.DEFAULT_COLOR = new dragonBones.ColorTransform();
    dragonBones.SlotData = SlotData;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * - The base class of bounding box data.
     * @see dragonBones.RectangleData
     * @see dragonBones.EllipseData
     * @see dragonBones.PolygonData
     * @version DragonBones 5.0
     * @language en_US
     */
    /**
     * - 边界框数据基类。
     * @see dragonBones.RectangleData
     * @see dragonBones.EllipseData
     * @see dragonBones.PolygonData
     * @version DragonBones 5.0
     * @language zh_CN
     */
    class BoundingBoxData extends dragonBones.BaseObject {
        /**
         * @private
         */
        _onClear() {
            this.color = 0x000000;
            this.width = 0.0;
            this.height = 0.0;
        }
    }
    dragonBones.BoundingBoxData = BoundingBoxData;
    /**
     * - The rectangle bounding box data.
     * @version DragonBones 5.1
     * @language en_US
     */
    /**
     * - 矩形边界框数据。
     * @version DragonBones 5.1
     * @language zh_CN
     */
    class RectangleBoundingBoxData extends BoundingBoxData {
        static toString() {
            return "[class dragonBones.RectangleBoundingBoxData]";
        }
        /**
         * - Compute the bit code for a point (x, y) using the clip rectangle
         */
        static _computeOutCode(x, y, xMin, yMin, xMax, yMax) {
            let code = 0 /* OutCode.InSide */; // initialised as being inside of [[clip window]]
            if (x < xMin) { // to the left of clip window
                code |= 1 /* OutCode.Left */;
            }
            else if (x > xMax) { // to the right of clip window
                code |= 2 /* OutCode.Right */;
            }
            if (y < yMin) { // below the clip window
                code |= 4 /* OutCode.Top */;
            }
            else if (y > yMax) { // above the clip window
                code |= 8 /* OutCode.Bottom */;
            }
            return code;
        }
        /**
         * @private
         */
        static rectangleIntersectsSegment(xA, yA, xB, yB, xMin, yMin, xMax, yMax, intersectionPointA = null, intersectionPointB = null, normalRadians = null) {
            const inSideA = xA > xMin && xA < xMax && yA > yMin && yA < yMax;
            const inSideB = xB > xMin && xB < xMax && yB > yMin && yB < yMax;
            if (inSideA && inSideB) {
                return -1;
            }
            let intersectionCount = 0;
            let outcode0 = RectangleBoundingBoxData._computeOutCode(xA, yA, xMin, yMin, xMax, yMax);
            let outcode1 = RectangleBoundingBoxData._computeOutCode(xB, yB, xMin, yMin, xMax, yMax);
            while (true) {
                if ((outcode0 | outcode1) === 0) { // Bitwise OR is 0. Trivially accept and get out of loop
                    intersectionCount = 2;
                    break;
                }
                else if ((outcode0 & outcode1) !== 0) { // Bitwise AND is not 0. Trivially reject and get out of loop
                    break;
                }
                // failed both tests, so calculate the line segment to clip
                // from an outside point to an intersection with clip edge
                let x = 0.0;
                let y = 0.0;
                let normalRadian = 0.0;
                // At least one endpoint is outside the clip rectangle; pick it.
                const outcodeOut = outcode0 !== 0 ? outcode0 : outcode1;
                // Now find the intersection point;
                if ((outcodeOut & 4 /* OutCode.Top */) !== 0) { // point is above the clip rectangle
                    x = xA + (xB - xA) * (yMin - yA) / (yB - yA);
                    y = yMin;
                    if (normalRadians !== null) {
                        normalRadian = -Math.PI * 0.5;
                    }
                }
                else if ((outcodeOut & 8 /* OutCode.Bottom */) !== 0) { // point is below the clip rectangle
                    x = xA + (xB - xA) * (yMax - yA) / (yB - yA);
                    y = yMax;
                    if (normalRadians !== null) {
                        normalRadian = Math.PI * 0.5;
                    }
                }
                else if ((outcodeOut & 2 /* OutCode.Right */) !== 0) { // point is to the right of clip rectangle
                    y = yA + (yB - yA) * (xMax - xA) / (xB - xA);
                    x = xMax;
                    if (normalRadians !== null) {
                        normalRadian = 0;
                    }
                }
                else if ((outcodeOut & 1 /* OutCode.Left */) !== 0) { // point is to the left of clip rectangle
                    y = yA + (yB - yA) * (xMin - xA) / (xB - xA);
                    x = xMin;
                    if (normalRadians !== null) {
                        normalRadian = Math.PI;
                    }
                }
                // Now we move outside point to intersection point to clip
                // and get ready for next pass.
                if (outcodeOut === outcode0) {
                    xA = x;
                    yA = y;
                    outcode0 = RectangleBoundingBoxData._computeOutCode(xA, yA, xMin, yMin, xMax, yMax);
                    if (normalRadians !== null) {
                        normalRadians.x = normalRadian;
                    }
                }
                else {
                    xB = x;
                    yB = y;
                    outcode1 = RectangleBoundingBoxData._computeOutCode(xB, yB, xMin, yMin, xMax, yMax);
                    if (normalRadians !== null) {
                        normalRadians.y = normalRadian;
                    }
                }
            }
            if (intersectionCount) {
                if (inSideA) {
                    intersectionCount = 2; // 10
                    if (intersectionPointA !== null) {
                        intersectionPointA.x = xB;
                        intersectionPointA.y = yB;
                    }
                    if (intersectionPointB !== null) {
                        intersectionPointB.x = xB;
                        intersectionPointB.y = xB;
                    }
                    if (normalRadians !== null) {
                        normalRadians.x = normalRadians.y + Math.PI;
                    }
                }
                else if (inSideB) {
                    intersectionCount = 1; // 01
                    if (intersectionPointA !== null) {
                        intersectionPointA.x = xA;
                        intersectionPointA.y = yA;
                    }
                    if (intersectionPointB !== null) {
                        intersectionPointB.x = xA;
                        intersectionPointB.y = yA;
                    }
                    if (normalRadians !== null) {
                        normalRadians.y = normalRadians.x + Math.PI;
                    }
                }
                else {
                    intersectionCount = 3; // 11
                    if (intersectionPointA !== null) {
                        intersectionPointA.x = xA;
                        intersectionPointA.y = yA;
                    }
                    if (intersectionPointB !== null) {
                        intersectionPointB.x = xB;
                        intersectionPointB.y = yB;
                    }
                }
            }
            return intersectionCount;
        }
        /**
         * @inheritDoc
         * @private
         */
        _onClear() {
            super._onClear();
            this.type = 0 /* BoundingBoxType.Rectangle */;
        }
        /**
         * @inheritDoc
         */
        containsPoint(pX, pY) {
            const widthH = this.width * 0.5;
            if (pX >= -widthH && pX <= widthH) {
                const heightH = this.height * 0.5;
                if (pY >= -heightH && pY <= heightH) {
                    return true;
                }
            }
            return false;
        }
        /**
         * @inheritDoc
         */
        intersectsSegment(xA, yA, xB, yB, intersectionPointA = null, intersectionPointB = null, normalRadians = null) {
            const widthH = this.width * 0.5;
            const heightH = this.height * 0.5;
            const intersectionCount = RectangleBoundingBoxData.rectangleIntersectsSegment(xA, yA, xB, yB, -widthH, -heightH, widthH, heightH, intersectionPointA, intersectionPointB, normalRadians);
            return intersectionCount;
        }
    }
    dragonBones.RectangleBoundingBoxData = RectangleBoundingBoxData;
    /**
     * - The ellipse bounding box data.
     * @version DragonBones 5.1
     * @language en_US
     */
    /**
     * - 椭圆边界框数据。
     * @version DragonBones 5.1
     * @language zh_CN
     */
    class EllipseBoundingBoxData extends BoundingBoxData {
        static toString() {
            return "[class dragonBones.EllipseData]";
        }
        /**
         * @private
         */
        static ellipseIntersectsSegment(xA, yA, xB, yB, xC, yC, widthH, heightH, intersectionPointA = null, intersectionPointB = null, normalRadians = null) {
            const d = widthH / heightH;
            const dd = d * d;
            yA *= d;
            yB *= d;
            const dX = xB - xA;
            const dY = yB - yA;
            const lAB = Math.sqrt(dX * dX + dY * dY);
            const xD = dX / lAB;
            const yD = dY / lAB;
            const a = (xC - xA) * xD + (yC - yA) * yD;
            const aa = a * a;
            const ee = xA * xA + yA * yA;
            const rr = widthH * widthH;
            const dR = rr - ee + aa;
            let intersectionCount = 0;
            if (dR >= 0.0) {
                const dT = Math.sqrt(dR);
                const sA = a - dT;
                const sB = a + dT;
                const inSideA = sA < 0.0 ? -1 : (sA <= lAB ? 0 : 1);
                const inSideB = sB < 0.0 ? -1 : (sB <= lAB ? 0 : 1);
                const sideAB = inSideA * inSideB;
                if (sideAB < 0) {
                    return -1;
                }
                else if (sideAB === 0) {
                    if (inSideA === -1) {
                        intersectionCount = 2; // 10
                        xB = xA + sB * xD;
                        yB = (yA + sB * yD) / d;
                        if (intersectionPointA !== null) {
                            intersectionPointA.x = xB;
                            intersectionPointA.y = yB;
                        }
                        if (intersectionPointB !== null) {
                            intersectionPointB.x = xB;
                            intersectionPointB.y = yB;
                        }
                        if (normalRadians !== null) {
                            normalRadians.x = Math.atan2(yB / rr * dd, xB / rr);
                            normalRadians.y = normalRadians.x + Math.PI;
                        }
                    }
                    else if (inSideB === 1) {
                        intersectionCount = 1; // 01
                        xA = xA + sA * xD;
                        yA = (yA + sA * yD) / d;
                        if (intersectionPointA !== null) {
                            intersectionPointA.x = xA;
                            intersectionPointA.y = yA;
                        }
                        if (intersectionPointB !== null) {
                            intersectionPointB.x = xA;
                            intersectionPointB.y = yA;
                        }
                        if (normalRadians !== null) {
                            normalRadians.x = Math.atan2(yA / rr * dd, xA / rr);
                            normalRadians.y = normalRadians.x + Math.PI;
                        }
                    }
                    else {
                        intersectionCount = 3; // 11
                        if (intersectionPointA !== null) {
                            intersectionPointA.x = xA + sA * xD;
                            intersectionPointA.y = (yA + sA * yD) / d;
                            if (normalRadians !== null) {
                                normalRadians.x = Math.atan2(intersectionPointA.y / rr * dd, intersectionPointA.x / rr);
                            }
                        }
                        if (intersectionPointB !== null) {
                            intersectionPointB.x = xA + sB * xD;
                            intersectionPointB.y = (yA + sB * yD) / d;
                            if (normalRadians !== null) {
                                normalRadians.y = Math.atan2(intersectionPointB.y / rr * dd, intersectionPointB.x / rr);
                            }
                        }
                    }
                }
            }
            return intersectionCount;
        }
        /**
         * @inheritDoc
         * @private
         */
        _onClear() {
            super._onClear();
            this.type = 1 /* BoundingBoxType.Ellipse */;
        }
        /**
         * @inheritDoc
         */
        containsPoint(pX, pY) {
            const widthH = this.width * 0.5;
            if (pX >= -widthH && pX <= widthH) {
                const heightH = this.height * 0.5;
                if (pY >= -heightH && pY <= heightH) {
                    pY *= widthH / heightH;
                    return Math.sqrt(pX * pX + pY * pY) <= widthH;
                }
            }
            return false;
        }
        /**
         * @inheritDoc
         */
        intersectsSegment(xA, yA, xB, yB, intersectionPointA = null, intersectionPointB = null, normalRadians = null) {
            const intersectionCount = EllipseBoundingBoxData.ellipseIntersectsSegment(xA, yA, xB, yB, 0.0, 0.0, this.width * 0.5, this.height * 0.5, intersectionPointA, intersectionPointB, normalRadians);
            return intersectionCount;
        }
    }
    dragonBones.EllipseBoundingBoxData = EllipseBoundingBoxData;
    /**
     * - The polygon bounding box data.
     * @version DragonBones 5.1
     * @language en_US
     */
    /**
     * - 多边形边界框数据。
     * @version DragonBones 5.1
     * @language zh_CN
     */
    class PolygonBoundingBoxData extends BoundingBoxData {
        constructor() {
            super(...arguments);
            /**
             * - The polygon vertices.
             * @version DragonBones 5.1
             * @language en_US
             */
            /**
             * - 多边形顶点。
             * @version DragonBones 5.1
             * @language zh_CN
             */
            this.vertices = [];
            /**
             * @private
             */
            this.weight = null; // Initial value.
        }
        static toString() {
            return "[class dragonBones.PolygonBoundingBoxData]";
        }
        /**
         * @private
         */
        static polygonIntersectsSegment(xA, yA, xB, yB, vertices, intersectionPointA = null, intersectionPointB = null, normalRadians = null) {
            if (xA === xB) {
                xA = xB + 0.000001;
            }
            if (yA === yB) {
                yA = yB + 0.000001;
            }
            const count = vertices.length;
            const dXAB = xA - xB;
            const dYAB = yA - yB;
            const llAB = xA * yB - yA * xB;
            let intersectionCount = 0;
            let xC = vertices[count - 2];
            let yC = vertices[count - 1];
            let dMin = 0.0;
            let dMax = 0.0;
            let xMin = 0.0;
            let yMin = 0.0;
            let xMax = 0.0;
            let yMax = 0.0;
            for (let i = 0; i < count; i += 2) {
                const xD = vertices[i];
                const yD = vertices[i + 1];
                if (xC === xD) {
                    xC = xD + 0.0001;
                }
                if (yC === yD) {
                    yC = yD + 0.0001;
                }
                const dXCD = xC - xD;
                const dYCD = yC - yD;
                const llCD = xC * yD - yC * xD;
                const ll = dXAB * dYCD - dYAB * dXCD;
                const x = (llAB * dXCD - dXAB * llCD) / ll;
                if (((x >= xC && x <= xD) || (x >= xD && x <= xC)) && (dXAB === 0.0 || (x >= xA && x <= xB) || (x >= xB && x <= xA))) {
                    const y = (llAB * dYCD - dYAB * llCD) / ll;
                    if (((y >= yC && y <= yD) || (y >= yD && y <= yC)) && (dYAB === 0.0 || (y >= yA && y <= yB) || (y >= yB && y <= yA))) {
                        if (intersectionPointB !== null) {
                            let d = x - xA;
                            if (d < 0.0) {
                                d = -d;
                            }
                            if (intersectionCount === 0) {
                                dMin = d;
                                dMax = d;
                                xMin = x;
                                yMin = y;
                                xMax = x;
                                yMax = y;
                                if (normalRadians !== null) {
                                    normalRadians.x = Math.atan2(yD - yC, xD - xC) - Math.PI * 0.5;
                                    normalRadians.y = normalRadians.x;
                                }
                            }
                            else {
                                if (d < dMin) {
                                    dMin = d;
                                    xMin = x;
                                    yMin = y;
                                    if (normalRadians !== null) {
                                        normalRadians.x = Math.atan2(yD - yC, xD - xC) - Math.PI * 0.5;
                                    }
                                }
                                if (d > dMax) {
                                    dMax = d;
                                    xMax = x;
                                    yMax = y;
                                    if (normalRadians !== null) {
                                        normalRadians.y = Math.atan2(yD - yC, xD - xC) - Math.PI * 0.5;
                                    }
                                }
                            }
                            intersectionCount++;
                        }
                        else {
                            xMin = x;
                            yMin = y;
                            xMax = x;
                            yMax = y;
                            intersectionCount++;
                            if (normalRadians !== null) {
                                normalRadians.x = Math.atan2(yD - yC, xD - xC) - Math.PI * 0.5;
                                normalRadians.y = normalRadians.x;
                            }
                            break;
                        }
                    }
                }
                xC = xD;
                yC = yD;
            }
            if (intersectionCount === 1) {
                if (intersectionPointA !== null) {
                    intersectionPointA.x = xMin;
                    intersectionPointA.y = yMin;
                }
                if (intersectionPointB !== null) {
                    intersectionPointB.x = xMin;
                    intersectionPointB.y = yMin;
                }
                if (normalRadians !== null) {
                    normalRadians.y = normalRadians.x + Math.PI;
                }
            }
            else if (intersectionCount > 1) {
                intersectionCount++;
                if (intersectionPointA !== null) {
                    intersectionPointA.x = xMin;
                    intersectionPointA.y = yMin;
                }
                if (intersectionPointB !== null) {
                    intersectionPointB.x = xMax;
                    intersectionPointB.y = yMax;
                }
            }
            return intersectionCount;
        }
        /**
         * @inheritDoc
         * @private
         */
        _onClear() {
            super._onClear();
            if (this.weight !== null) {
                this.weight.returnToPool();
            }
            this.type = 2 /* BoundingBoxType.Polygon */;
            this.x = 0.0;
            this.y = 0.0;
            this.vertices.length = 0;
            this.weight = null;
        }
        /**
         * @inheritDoc
         */
        containsPoint(pX, pY) {
            let isInSide = false;
            if (pX >= this.x && pX <= this.width && pY >= this.y && pY <= this.height) {
                for (let i = 0, l = this.vertices.length, iP = l - 2; i < l; i += 2) {
                    const yA = this.vertices[iP + 1];
                    const yB = this.vertices[i + 1];
                    if ((yB < pY && yA >= pY) || (yA < pY && yB >= pY)) {
                        const xA = this.vertices[iP];
                        const xB = this.vertices[i];
                        if ((pY - yB) * (xA - xB) / (yA - yB) + xB < pX) {
                            isInSide = !isInSide;
                        }
                    }
                    iP = i;
                }
            }
            return isInSide;
        }
        /**
         * @inheritDoc
         */
        intersectsSegment(xA, yA, xB, yB, intersectionPointA = null, intersectionPointB = null, normalRadians = null) {
            let intersectionCount = 0;
            if (RectangleBoundingBoxData.rectangleIntersectsSegment(xA, yA, xB, yB, this.x, this.y, this.x + this.width, this.y + this.height, null, null, null) !== 0) {
                intersectionCount = PolygonBoundingBoxData.polygonIntersectsSegment(xA, yA, xB, yB, this.vertices, intersectionPointA, intersectionPointB, normalRadians);
            }
            return intersectionCount;
        }
    }
    dragonBones.PolygonBoundingBoxData = PolygonBoundingBoxData;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * @internal
     * @private
     */
    class CanvasData extends dragonBones.BaseObject {
        static toString() {
            return "[class dragonBones.CanvasData]";
        }
        _onClear() {
            this.hasBackground = false;
            this.color = 0x000000;
            this.x = 0;
            this.y = 0;
            this.width = 0;
            this.height = 0;
        }
    }
    dragonBones.CanvasData = CanvasData;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * @internal
     * @private
     */
    class ConstraintData extends dragonBones.BaseObject {
        _onClear() {
            this.order = 0;
            this.name = "";
            this.target = null; //
            this.root = null; //
            this.bone = null;
        }
    }
    dragonBones.ConstraintData = ConstraintData;
    /**
     * @internal
     * @private
     */
    class IKConstraintData extends ConstraintData {
        static toString() {
            return "[class dragonBones.IKConstraintData]";
        }
        _onClear() {
            super._onClear();
            this.scaleEnabled = false;
            this.bendPositive = false;
            this.weight = 1.0;
        }
    }
    dragonBones.IKConstraintData = IKConstraintData;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * @internal
     * @private
     */
    class DisplayData extends dragonBones.BaseObject {
        constructor() {
            super(...arguments);
            this.transform = new dragonBones.Transform();
        }
        _onClear() {
            this.name = "";
            this.path = "";
            this.transform.identity();
            this.parent = null; //
        }
    }
    dragonBones.DisplayData = DisplayData;
    /**
     * @internal
     * @private
     */
    class ImageDisplayData extends DisplayData {
        constructor() {
            super(...arguments);
            this.pivot = new dragonBones.Point();
        }
        static toString() {
            return "[class dragonBones.ImageDisplayData]";
        }
        _onClear() {
            super._onClear();
            this.type = 0 /* DisplayType.Image */;
            this.pivot.clear();
            this.texture = null;
        }
    }
    dragonBones.ImageDisplayData = ImageDisplayData;
    /**
     * @internal
     * @private
     */
    class ArmatureDisplayData extends DisplayData {
        constructor() {
            super(...arguments);
            this.actions = [];
        }
        static toString() {
            return "[class dragonBones.ArmatureDisplayData]";
        }
        _onClear() {
            super._onClear();
            for (const action of this.actions) {
                action.returnToPool();
            }
            this.type = 1 /* DisplayType.Armature */;
            this.inheritAnimation = false;
            this.actions.length = 0;
            this.armature = null;
        }
        /**
         * @private
         */
        addAction(value) {
            this.actions.push(value);
        }
    }
    dragonBones.ArmatureDisplayData = ArmatureDisplayData;
    /**
     * @internal
     * @private
     */
    class MeshDisplayData extends DisplayData {
        constructor() {
            super(...arguments);
            this.weight = null; // Initial value.
            this.glue = null; // Initial value.
        }
        static toString() {
            return "[class dragonBones.MeshDisplayData]";
        }
        _onClear() {
            super._onClear();
            if (this.weight !== null) {
                this.weight.returnToPool();
            }
            if (this.glue !== null) {
                this.glue.returnToPool();
            }
            this.type = 2 /* DisplayType.Mesh */;
            this.inheritDeform = false;
            this.offset = 0;
            this.weight = null;
            this.glue = null;
            this.texture = null;
        }
    }
    dragonBones.MeshDisplayData = MeshDisplayData;
    /**
     * @internal
     * @private
     */
    class BoundingBoxDisplayData extends DisplayData {
        constructor() {
            super(...arguments);
            this.boundingBox = null; // Initial value.
        }
        static toString() {
            return "[class dragonBones.BoundingBoxDisplayData]";
        }
        _onClear() {
            super._onClear();
            if (this.boundingBox !== null) {
                this.boundingBox.returnToPool();
            }
            this.type = 3 /* DisplayType.BoundingBox */;
            this.boundingBox = null;
        }
    }
    dragonBones.BoundingBoxDisplayData = BoundingBoxDisplayData;
    /**
     * @internal
     * @private
     */
    class WeightData extends dragonBones.BaseObject {
        constructor() {
            super(...arguments);
            this.bones = [];
        }
        static toString() {
            return "[class dragonBones.WeightData]";
        }
        _onClear() {
            this.count = 0;
            this.offset = 0;
            this.bones.length = 0;
        }
        addBone(value) {
            this.bones.push(value);
        }
    }
    dragonBones.WeightData = WeightData;
    /**
     * @internal
     * @private
     */
    class GlueData extends dragonBones.BaseObject {
        constructor() {
            super(...arguments);
            this.meshes = [];
        }
        static toString() {
            return "[class dragonBones.GlueData]";
        }
        _onClear() {
            this.weights.length = 0;
            this.meshes.length = 0;
        }
        addMesh(value) {
            this.meshes.push(value);
        }
    }
    dragonBones.GlueData = GlueData;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * - The DragonBones data.
     * A DragonBones data contains multiple armature data.
     * @see dragonBones.ArmatureData
     * @version DragonBones 3.0
     * @language en_US
     */
    /**
     * - 龙骨数据。
     * 一个龙骨数据包含多个骨架数据。
     * @see dragonBones.ArmatureData
     * @version DragonBones 3.0
     * @language zh_CN
     */
    class DragonBonesData extends dragonBones.BaseObject {
        constructor() {
            super(...arguments);
            /**
             * @internal
             * @private
             */
            this.frameIndices = [];
            /**
             * @internal
             * @private
             */
            this.cachedFrames = [];
            /**
             * - All armature data names.
             * @version DragonBones 3.0
             * @language en_US
             */
            /**
             * - 所有的骨架数据名称。
             * @version DragonBones 3.0
             * @language zh_CN
             */
            this.armatureNames = [];
            /**
             * @private
             */
            this.armatures = {};
            /**
             * @private
             */
            this.userData = null; // Initial value.
        }
        static toString() {
            return "[class dragonBones.DragonBonesData]";
        }
        /**
         * @inheritDoc
         */
        _onClear() {
            for (let k in this.armatures) {
                this.armatures[k].returnToPool();
                delete this.armatures[k];
            }
            if (this.userData !== null) {
                this.userData.returnToPool();
            }
            this.autoSearch = false;
            this.frameRate = 0;
            this.version = "";
            this.name = "";
            this.stage = null;
            this.frameIndices.length = 0;
            this.cachedFrames.length = 0;
            this.armatureNames.length = 0;
            //this.armatures.clear();
            this.binary = null; //
            this.intArray = null; //
            this.floatArray = null; //
            this.frameIntArray = null; //
            this.frameFloatArray = null; //
            this.frameArray = null; //
            this.timelineArray = null; //
            this.userData = null;
        }
        /**
         * @internal
         * @private
         */
        addArmature(value) {
            if (value.name in this.armatures) {
                console.warn("Same armature: " + value.name);
                return;
            }
            value.parent = this;
            this.armatures[value.name] = value;
            this.armatureNames.push(value.name);
        }
        /**
         * - Get a specific armature data.
         * @param name - The armature data name.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 获取特定的骨架数据。
         * @param name - 骨架数据名称。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        getArmature(name) {
            return name in this.armatures ? this.armatures[name] : null;
        }
        /**
         * - Deprecated, please refer to {@link #dragonBones.BaseFactory#removeDragonBonesData()}.
         * @deprecated
         * @language en_US
         */
        /**
         * - 已废弃，请参考 {@link #dragonBones.BaseFactory#removeDragonBonesData()}。
         * @deprecated
         * @language zh_CN
         */
        dispose() {
            console.warn("已废弃");
            this.returnToPool();
        }
    }
    dragonBones.DragonBonesData = DragonBonesData;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * - The skin data, typically a armature data instance contains at least one skinData.
     * @version DragonBones 3.0
     * @language en_US
     */
    /**
     * - 皮肤数据，通常一个骨架数据至少包含一个皮肤数据。
     * @version DragonBones 3.0
     * @language zh_CN
     */
    class SkinData extends dragonBones.BaseObject {
        constructor() {
            super(...arguments);
            /**
             * @private
             */
            this.displays = {};
        }
        static toString() {
            return "[class dragonBones.SkinData]";
        }
        /**
         * @inheritDoc
         */
        _onClear() {
            for (let k in this.displays) {
                const slotDisplays = this.displays[k];
                for (const display of slotDisplays) {
                    if (display !== null) {
                        display.returnToPool();
                    }
                }
                delete this.displays[k];
            }
            this.name = "";
            // this.displays.clear();
            this.parent = null; //
        }
        /**
         * @internal
         * @private
         */
        addDisplay(slotName, value) {
            if (!(slotName in this.displays)) {
                this.displays[slotName] = [];
            }
            if (value !== null) {
                value.parent = this;
            }
            const slotDisplays = this.displays[slotName]; // TODO clear prev
            slotDisplays.push(value);
        }
        /**
         * @private
         */
        getDisplay(slotName, displayName) {
            const slotDisplays = this.getDisplays(slotName);
            if (slotDisplays !== null) {
                for (const display of slotDisplays) {
                    if (display !== null && display.name === displayName) {
                        return display;
                    }
                }
            }
            return null;
        }
        /**
         * @private
         */
        getDisplays(slotName) {
            if (!(slotName in this.displays)) {
                return null;
            }
            return this.displays[slotName];
        }
    }
    dragonBones.SkinData = SkinData;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * - The texture atlas data.
     * @version DragonBones 3.0
     * @language en_US
     */
    /**
     * - 贴图集数据。
     * @version DragonBones 3.0
     * @language zh_CN
     */
    class TextureAtlasData extends dragonBones.BaseObject {
        constructor() {
            super(...arguments);
            /**
             * @private
             */
            this.textures = {};
        }
        /**
         * @inheritDoc
         */
        _onClear() {
            for (let k in this.textures) {
                this.textures[k].returnToPool();
                delete this.textures[k];
            }
            this.autoSearch = false;
            this.width = 0;
            this.height = 0;
            this.scale = 1.0;
            // this.textures.clear();
            this.name = "";
            this.imagePath = "";
        }
        /**
         * @private
         */
        copyFrom(value) {
            this.autoSearch = value.autoSearch;
            this.scale = value.scale;
            this.width = value.width;
            this.height = value.height;
            this.name = value.name;
            this.imagePath = value.imagePath;
            for (let k in this.textures) {
                this.textures[k].returnToPool();
                delete this.textures[k];
            }
            // this.textures.clear();
            for (let k in value.textures) {
                const texture = this.createTexture();
                texture.copyFrom(value.textures[k]);
                this.textures[k] = texture;
            }
        }
        /**
         * @internal
         * @private
         */
        addTexture(value) {
            if (value.name in this.textures) {
                console.warn("Same texture: " + value.name);
                return;
            }
            value.parent = this;
            this.textures[value.name] = value;
        }
        /**
         * @private
         */
        getTexture(name) {
            return name in this.textures ? this.textures[name] : null;
        }
    }
    dragonBones.TextureAtlasData = TextureAtlasData;
    /**
     * @internal
     * @private
     */
    class TextureData extends dragonBones.BaseObject {
        constructor() {
            super(...arguments);
            this.region = new dragonBones.Rectangle();
            this.frame = null; // Initial value.
        }
        static createRectangle() {
            return new dragonBones.Rectangle();
        }
        _onClear() {
            this.rotated = false;
            this.name = "";
            this.region.clear();
            this.parent = null; //
            this.frame = null;
        }
        copyFrom(value) {
            this.rotated = value.rotated;
            this.name = value.name;
            this.region.copyFrom(value.region);
            this.parent = value.parent;
            if (this.frame === null && value.frame !== null) {
                this.frame = TextureData.createRectangle();
            }
            else if (this.frame !== null && value.frame === null) {
                this.frame = null;
            }
            if (this.frame !== null && value.frame !== null) {
                this.frame.copyFrom(value.frame);
            }
        }
    }
    dragonBones.TextureData = TextureData;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * - The user custom data.
     * @version DragonBones 5.0
     * @language en_US
     */
    /**
     * - 用户自定义数据。
     * @version DragonBones 5.0
     * @language zh_CN
     */
    class UserData extends dragonBones.BaseObject {
        constructor() {
            super(...arguments);
            /**
             * - The custom int numbers.
             * @version DragonBones 5.0
             * @language en_US
             */
            /**
             * - 自定义整数。
             * @version DragonBones 5.0
             * @language zh_CN
             */
            this.ints = [];
            /**
             * - The custom float numbers.
             * @version DragonBones 5.0
             * @language en_US
             */
            /**
             * - 自定义浮点数。
             * @version DragonBones 5.0
             * @language zh_CN
             */
            this.floats = [];
            /**
             * - The custom strings.
             * @version DragonBones 5.0
             * @language en_US
             */
            /**
             * - 自定义字符串。
             * @version DragonBones 5.0
             * @language zh_CN
             */
            this.strings = [];
        }
        static toString() {
            return "[class dragonBones.UserData]";
        }
        /**
         * @inheritDoc
         */
        _onClear() {
            this.ints.length = 0;
            this.floats.length = 0;
            this.strings.length = 0;
        }
        /**
         * @internal
         * @private
         */
        addInt(value) {
            this.ints.push(value);
        }
        /**
         * @internal
         * @private
         */
        addFloat(value) {
            this.floats.push(value);
        }
        /**
         * @internal
         * @private
         */
        addString(value) {
            this.strings.push(value);
        }
        /**
         * - Get the custom int number.
         * @version DragonBones 5.0
         * @language en_US
         */
        /**
         * - 获取自定义整数。
         * @version DragonBones 5.0
         * @language zh_CN
         */
        getInt(index = 0) {
            return index >= 0 && index < this.ints.length ? this.ints[index] : 0;
        }
        /**
         * - Get the custom float number.
         * @version DragonBones 5.0
         * @language en_US
         */
        /**
         * - 获取自定义浮点数。
         * @version DragonBones 5.0
         * @language zh_CN
         */
        getFloat(index = 0) {
            return index >= 0 && index < this.floats.length ? this.floats[index] : 0.0;
        }
        /**
         * - Get the custom string.
         * @version DragonBones 5.0
         * @language en_US
         */
        /**
         * - 获取自定义字符串。
         * @version DragonBones 5.0
         * @language zh_CN
         */
        getString(index = 0) {
            return index >= 0 && index < this.strings.length ? this.strings[index] : "";
        }
    }
    dragonBones.UserData = UserData;
    /**
     * @internal
     * @private
     */
    class ActionData extends dragonBones.BaseObject {
        constructor() {
            super(...arguments);
            this.data = null; //
        }
        static toString() {
            return "[class dragonBones.ActionData]";
        }
        _onClear() {
            if (this.data !== null) {
                this.data.returnToPool();
            }
            this.type = 0 /* ActionType.Play */;
            this.name = "";
            this.bone = null;
            this.slot = null;
            this.data = null;
        }
    }
    dragonBones.ActionData = ActionData;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * - The properties of the object carry basic information about an event,
     * which are passed as parameter or parameter's parameter to event listeners when an event occurs.
     * @version DragonBones 4.5
     * @language en_US
     */
    /**
     * - 事件对象，包含有关事件的基本信息，当发生事件时，该实例将作为参数或参数的参数传递给事件侦听器。
     * @version DragonBones 4.5
     * @language zh_CN
     */
    class EventObject extends dragonBones.BaseObject {
        static toString() {
            return "[class dragonBones.EventObject]";
        }
        /**
         * @private
         */
        _onClear() {
            this.time = 0.0;
            this.type = "";
            this.name = "";
            this.armature = null;
            this.bone = null;
            this.slot = null;
            this.animationState = null;
            this.data = null;
        }
    }
    /**
     * - Animation start play.
     * @version DragonBones 4.5
     * @language en_US
     */
    /**
     * - 动画开始播放。
     * @version DragonBones 4.5
     * @language zh_CN
     */
    EventObject.START = "start";
    /**
     * - Animation loop play complete once.
     * @version DragonBones 4.5
     * @language en_US
     */
    /**
     * - 动画循环播放完成一次。
     * @version DragonBones 4.5
     * @language zh_CN
     */
    EventObject.LOOP_COMPLETE = "loopComplete";
    /**
     * - Animation play complete.
     * @version DragonBones 4.5
     * @language en_US
     */
    /**
     * - 动画播放完成。
     * @version DragonBones 4.5
     * @language zh_CN
     */
    EventObject.COMPLETE = "complete";
    /**
     * - Animation fade in start.
     * @version DragonBones 4.5
     * @language en_US
     */
    /**
     * - 动画淡入开始。
     * @version DragonBones 4.5
     * @language zh_CN
     */
    EventObject.FADE_IN = "fadeIn";
    /**
     * - Animation fade in complete.
     * @version DragonBones 4.5
     * @language en_US
     */
    /**
     * - 动画淡入完成。
     * @version DragonBones 4.5
     * @language zh_CN
     */
    EventObject.FADE_IN_COMPLETE = "fadeInComplete";
    /**
     * - Animation fade out start.
     * @version DragonBones 4.5
     * @language en_US
     */
    /**
     * - 动画淡出开始。
     * @version DragonBones 4.5
     * @language zh_CN
     */
    EventObject.FADE_OUT = "fadeOut";
    /**
     * - Animation fade out complete.
     * @version DragonBones 4.5
     * @language en_US
     */
    /**
     * - 动画淡出完成。
     * @version DragonBones 4.5
     * @language zh_CN
     */
    EventObject.FADE_OUT_COMPLETE = "fadeOutComplete";
    /**
     * - Animation frame event.
     * @version DragonBones 4.5
     * @language en_US
     */
    /**
     * - 动画帧事件。
     * @version DragonBones 4.5
     * @language zh_CN
     */
    EventObject.FRAME_EVENT = "frameEvent";
    /**
     * - Animation frame sound event.
     * @version DragonBones 4.5
     * @language en_US
     */
    /**
     * - 动画帧声音事件。
     * @version DragonBones 4.5
     * @language zh_CN
     */
    EventObject.SOUND_EVENT = "soundEvent";
    dragonBones.EventObject = EventObject;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * - The base class of the transform object.
     * @see dragonBones.Transform
     * @version DragonBones 4.5
     * @language en_US
     */
    /**
     * - 变换对象的基类。
     * @see dragonBones.Transform
     * @version DragonBones 4.5
     * @language zh_CN
     */
    class TransformObject extends dragonBones.BaseObject {
        constructor() {
            super(...arguments);
            /**
             * - A matrix relative to the armature coordinate system.
             * @version DragonBones 3.0
             * @language en_US
             */
            /**
             * - 相对于骨架坐标系的矩阵。
             * @version DragonBones 3.0
             * @language zh_CN
             */
            this.globalTransformMatrix = new dragonBones.Matrix();
            /**
             * - A transform relative to the armature coordinate system.
             * @see #updateGlobalTransform()
             * @version DragonBones 3.0
             * @language en_US
             */
            /**
             * - 相对于骨架坐标系的变换。
             * @see #updateGlobalTransform()
             * @version DragonBones 3.0
             * @language zh_CN
             */
            this.global = new dragonBones.Transform();
            /**
             * - The offset transform relative to the armature or the parent bone coordinate system.
             * @see #dragonBones.Bone#invalidUpdate()
             * @version DragonBones 3.0
             * @language en_US
             */
            /**
             * - 相对于骨架或父骨骼坐标系的偏移变换。
             * @see #dragonBones.Bone#invalidUpdate()
             * @version DragonBones 3.0
             * @language zh_CN
             */
            this.offset = new dragonBones.Transform();
        }
        /**
         * @private
         */
        _onClear() {
            this.globalTransformMatrix.identity();
            this.global.identity();
            this.offset.identity();
            this.origin = null;
            this.userData = null;
            this._globalDirty = false;
            this._armature = null; //
            this._parent = null; //
        }
        /**
         * @internal
         * @private
         */
        _setArmature(value) {
            this._armature = value;
        }
        /**
         * @internal
         * @private
         */
        _setParent(value) {
            this._parent = value;
        }
        /**
         * - For performance considerations, rotation or scale in the {@link #global} attribute of the bone or slot is not always properly accessible,
         * some engines do not rely on these attributes to update rendering, such as Egret.
         * The use of this method ensures that the access to the {@link #global} property is correctly rotation or scale.
         * @example
         * <pre>
         *     bone.updateGlobalTransform();
         *     let rotation = bone.global.rotation;
         * </pre>
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 出于性能的考虑，骨骼或插槽的 {@link #global} 属性中的旋转或缩放并不总是正确可访问的，有些引擎并不依赖这些属性更新渲染，比如 Egret。
         * 使用此方法可以保证访问到 {@link #global} 属性中正确的旋转或缩放。
         * @example
         * <pre>
         *     bone.updateGlobalTransform();
         *     let rotation = bone.global.rotation;
         * </pre>
         * @version DragonBones 3.0
         * @language zh_CN
         */
        updateGlobalTransform() {
            if (this._globalDirty) {
                this._globalDirty = false;
                this.global.fromMatrix(this.globalTransformMatrix);
            }
        }
        /**
         * - The armature to which it belongs.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 所属的骨架。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        get armature() {
            return this._armature;
        }
        /**
         * - The parent bone to which it belongs.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 所属的父骨骼。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        get parent() {
            return this._parent;
        }
    }
    /**
     * @private
     */
    TransformObject._helpMatrix = new dragonBones.Matrix();
    /**
     * @private
     */
    TransformObject._helpTransform = new dragonBones.Transform();
    /**
     * @private
     */
    TransformObject._helpPoint = new dragonBones.Point();
    dragonBones.TransformObject = TransformObject;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * - Bone is one of the most important logical units in the armature animation system,
     * and is responsible for the realization of translate, rotation, scaling in the animations.
     * A armature can contain multiple bones.
     * @see dragonBones.BoneData
     * @see dragonBones.Armature
     * @see dragonBones.Slot
     * @version DragonBones 3.0
     * @language en_US
     */
    /**
     * - 骨骼在骨骼动画体系中是最重要的逻辑单元之一，负责动画中的平移、旋转、缩放的实现。
     * 一个骨架中可以包含多个骨骼。
     * @see dragonBones.BoneData
     * @see dragonBones.Armature
     * @see dragonBones.Slot
     * @version DragonBones 3.0
     * @language zh_CN
     */
    class Bone extends dragonBones.TransformObject {
        constructor() {
            super(...arguments);
            /**
             * @internal
             * @private
             */
            this.animationPose = new dragonBones.Transform();
            /**
             * @internal
             * @private
             */
            this._blendState = new dragonBones.BlendState();
        }
        static toString() {
            return "[class dragonBones.Bone]";
        }
        /**
         * @inheritDoc
         */
        _onClear() {
            super._onClear();
            this.offsetMode = 1 /* OffsetMode.Additive */;
            this.animationPose.identity();
            this._transformDirty = false;
            this._childrenTransformDirty = false;
            this._localDirty = true;
            this._hasConstraint = false;
            this._visible = true;
            this._cachedFrameIndex = -1;
            this._blendState.clear();
            this._boneData = null; //
            this._cachedFrameIndices = null;
        }
        /**
         * @private
         */
        _updateGlobalTransformMatrix(isCache) {
            const boneData = this._boneData;
            const parent = this._parent;
            const flipX = this._armature.flipX;
            const flipY = this._armature.flipY === dragonBones.DragonBones.yDown;
            let inherit = parent !== null;
            let rotation = 0.0;
            const global = this.global;
            const globalTransformMatrix = this.globalTransformMatrix;
            if (this.offsetMode === 1 /* OffsetMode.Additive */) {
                if (this.origin !== null) {
                    // global.copyFrom(this.origin).add(this.offset).add(this.animationPose);
                    global.x = this.origin.x + this.offset.x + this.animationPose.x;
                    global.y = this.origin.y + this.offset.y + this.animationPose.y;
                    global.skew = this.origin.skew + this.offset.skew + this.animationPose.skew;
                    global.rotation = this.origin.rotation + this.offset.rotation + this.animationPose.rotation;
                    global.scaleX = this.origin.scaleX * this.offset.scaleX * this.animationPose.scaleX;
                    global.scaleY = this.origin.scaleY * this.offset.scaleY * this.animationPose.scaleY;
                }
                else {
                    global.copyFrom(this.offset).add(this.animationPose);
                }
            }
            else if (this.offsetMode === 0 /* OffsetMode.None */) {
                if (this.origin !== null) {
                    global.copyFrom(this.origin).add(this.animationPose);
                }
                else {
                    global.copyFrom(this.animationPose);
                }
            }
            else {
                inherit = false;
                global.copyFrom(this.offset);
            }
            if (inherit) {
                const parentMatrix = parent._boneData.type === 0 /* BoneType.Bone */ ? parent.globalTransformMatrix : parent._getGlobalTransformMatrix(global.x, global.y);
                if (boneData.inheritScale) {
                    if (!boneData.inheritRotation) {
                        parent.updateGlobalTransform();
                        if (flipX && flipY) {
                            rotation = global.rotation - (parent.global.rotation + Math.PI);
                        }
                        else if (flipX) {
                            rotation = global.rotation + parent.global.rotation + Math.PI;
                        }
                        else if (flipY) {
                            rotation = global.rotation + parent.global.rotation;
                        }
                        else {
                            rotation = global.rotation - parent.global.rotation;
                        }
                        global.rotation = rotation;
                    }
                    global.toMatrix(globalTransformMatrix);
                    globalTransformMatrix.concat(parentMatrix);
                    if (boneData.inheritTranslation) {
                        global.x = globalTransformMatrix.tx;
                        global.y = globalTransformMatrix.ty;
                    }
                    else {
                        globalTransformMatrix.tx = global.x;
                        globalTransformMatrix.ty = global.y;
                    }
                    if (isCache) {
                        global.fromMatrix(globalTransformMatrix);
                    }
                    else {
                        this._globalDirty = true;
                    }
                }
                else {
                    if (boneData.inheritTranslation) {
                        const x = global.x;
                        const y = global.y;
                        global.x = parentMatrix.a * x + parentMatrix.c * y + parentMatrix.tx;
                        global.y = parentMatrix.b * x + parentMatrix.d * y + parentMatrix.ty;
                    }
                    else {
                        if (flipX) {
                            global.x = -global.x;
                        }
                        if (flipY) {
                            global.y = -global.y;
                        }
                    }
                    if (boneData.inheritRotation) {
                        parent.updateGlobalTransform();
                        if (parent.global.scaleX < 0.0) {
                            rotation = global.rotation + parent.global.rotation + Math.PI;
                        }
                        else {
                            rotation = global.rotation + parent.global.rotation;
                        }
                        if (parentMatrix.a * parentMatrix.d - parentMatrix.b * parentMatrix.c < 0.0) {
                            rotation -= global.rotation * 2.0;
                            if (flipX !== flipY || boneData.inheritReflection) {
                                global.skew += Math.PI;
                            }
                        }
                        global.rotation = rotation;
                    }
                    else if (flipX || flipY) {
                        if (flipX && flipY) {
                            rotation = global.rotation + Math.PI;
                        }
                        else {
                            if (flipX) {
                                rotation = Math.PI - global.rotation;
                            }
                            else {
                                rotation = -global.rotation;
                            }
                            global.skew += Math.PI;
                        }
                        global.rotation = rotation;
                    }
                    global.toMatrix(globalTransformMatrix);
                }
            }
            else {
                if (flipX || flipY) {
                    if (flipX) {
                        global.x = -global.x;
                    }
                    if (flipY) {
                        global.y = -global.y;
                    }
                    if (flipX && flipY) {
                        rotation = global.rotation + Math.PI;
                    }
                    else {
                        if (flipX) {
                            rotation = Math.PI - global.rotation;
                        }
                        else {
                            rotation = -global.rotation;
                        }
                        global.skew += Math.PI;
                    }
                    global.rotation = rotation;
                }
                global.toMatrix(globalTransformMatrix);
            }
        }
        /**
         * @inheritDoc
         */
        _setArmature(value) {
            if (this._armature === value) {
                return;
            }
            let oldSlots = null;
            let oldBones = null;
            if (this._armature !== null) {
                oldSlots = this.getSlots();
                oldBones = this.getBones();
                this._armature._removeBoneFromBoneList(this);
            }
            this._armature = value; //
            if (this._armature !== null) {
                this._armature._addBoneToBoneList(this);
            }
            if (oldSlots !== null) {
                for (const slot of oldSlots) {
                    if (slot.parent === this) {
                        slot._setArmature(this._armature);
                    }
                }
            }
            if (oldBones !== null) {
                for (const bone of oldBones) {
                    if (bone.parent === this) {
                        bone._setArmature(this._armature);
                    }
                }
            }
        }
        /**
         * @internal
         * @private
         */
        init(boneData) {
            if (this._boneData !== null) {
                return;
            }
            this._boneData = boneData;
            //
            this.origin = this._boneData.transform;
        }
        /**
         * @internal
         * @private
         */
        update(cacheFrameIndex) {
            this._blendState.dirty = false;
            if (cacheFrameIndex >= 0 && this._cachedFrameIndices !== null) {
                const cachedFrameIndex = this._cachedFrameIndices[cacheFrameIndex];
                if (cachedFrameIndex >= 0 && this._cachedFrameIndex === cachedFrameIndex) { // Same cache.
                    this._transformDirty = false;
                }
                else if (cachedFrameIndex >= 0) { // Has been Cached.
                    this._transformDirty = true;
                    this._cachedFrameIndex = cachedFrameIndex;
                }
                else {
                    if (this._hasConstraint) { // Update constraints.
                        for (const constraint of this._armature._constraints) {
                            if (constraint._root === this) {
                                constraint.update();
                            }
                        }
                    }
                    if (this._transformDirty ||
                        (this._parent !== null && this._parent._childrenTransformDirty)) { // Dirty.
                        this._transformDirty = true;
                        this._cachedFrameIndex = -1;
                    }
                    else if (this._cachedFrameIndex >= 0) { // Same cache, but not set index yet.
                        this._transformDirty = false;
                        this._cachedFrameIndices[cacheFrameIndex] = this._cachedFrameIndex;
                    }
                    else { // Dirty.
                        this._transformDirty = true;
                        this._cachedFrameIndex = -1;
                    }
                }
            }
            else {
                if (this._hasConstraint) { // Update constraints.
                    for (const constraint of this._armature._constraints) {
                        if (constraint._root === this) {
                            constraint.update();
                        }
                    }
                }
                if (this._transformDirty || (this._parent !== null && this._parent._childrenTransformDirty)) { // Dirty.
                    cacheFrameIndex = -1;
                    this._transformDirty = true;
                    this._cachedFrameIndex = -1;
                }
            }
            if (this._transformDirty) {
                this._transformDirty = false;
                this._childrenTransformDirty = true;
                //
                if (this._cachedFrameIndex < 0) {
                    const isCache = cacheFrameIndex >= 0;
                    if (this._localDirty) {
                        this._updateGlobalTransformMatrix(isCache);
                    }
                    if (isCache && this._cachedFrameIndices !== null) {
                        this._cachedFrameIndex = this._cachedFrameIndices[cacheFrameIndex] = this._armature._armatureData.setCacheFrame(this.globalTransformMatrix, this.global);
                    }
                }
                else {
                    this._armature._armatureData.getCacheFrame(this.globalTransformMatrix, this.global, this._cachedFrameIndex);
                }
                //
            }
            else if (this._childrenTransformDirty) {
                this._childrenTransformDirty = false;
            }
            this._localDirty = true;
        }
        /**
         * @internal
         * @private
         */
        updateByConstraint() {
            if (this._localDirty) {
                this._localDirty = false;
                if (this._transformDirty || (this._parent !== null && this._parent._childrenTransformDirty)) {
                    this._updateGlobalTransformMatrix(true);
                }
                this._transformDirty = true;
            }
        }
        /**
         * - Forces the bone to update the transform in the next frame.
         * When the bone is not animated or its animation state is finished, the bone will not continue to update,
         * and when the skeleton must be updated for some reason, the method needs to be called explicitly.
         * @example
         * <pre>
         *     let bone = armature.getBone("arm");
         *     bone.offset.scaleX = 2.0;
         *     bone.invalidUpdate();
         * </pre>
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 强制骨骼在下一帧更新变换。
         * 当该骨骼没有动画状态或其动画状态播放完成时，骨骼将不在继续更新，而此时由于某些原因必须更新骨骼时，则需要显式调用该方法。
         * @example
         * <pre>
         *     let bone = armature.getBone("arm");
         *     bone.offset.scaleX = 2.0;
         *     bone.invalidUpdate();
         * </pre>
         * @version DragonBones 3.0
         * @language zh_CN
         */
        invalidUpdate() {
            this._transformDirty = true;
        }
        /**
         * - Check whether the bone contains a specific bone or slot.
         * @see dragonBones.Bone
         * @see dragonBones.Slot
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 检查该骨骼是否包含特定的骨骼或插槽。
         * @see dragonBones.Bone
         * @see dragonBones.Slot
         * @version DragonBones 3.0
         * @language zh_CN
         */
        contains(value) {
            if (value === this) {
                return false;
            }
            let ancestor = value;
            while (ancestor !== this && ancestor !== null) {
                ancestor = ancestor.parent;
            }
            return ancestor === this;
        }
        /**
         * - The bone data.
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 骨骼数据。
         * @version DragonBones 4.5
         * @language zh_CN
         */
        get boneData() {
            return this._boneData;
        }
        /**
         * - The visible of all slots in the bone.
         * @default true
         * @see dragonBones.Slot#visible
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 此骨骼所有插槽的可见。
         * @default true
         * @see dragonBones.Slot#visible
         * @version DragonBones 3.0
         * @language zh_CN
         */
        get visible() {
            return this._visible;
        }
        set visible(value) {
            if (this._visible === value) {
                return;
            }
            this._visible = value;
            for (const slot of this._armature.getSlots()) {
                if (slot._parent === this) {
                    slot._updateVisible();
                }
            }
        }
        /**
         * - The bone name.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 骨骼名称。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        get name() {
            return this._boneData.name;
        }
        /**
         * - Deprecated, please refer to {@link dragonBones.Armature#getBones()}.
         * @deprecated
         * @language en_US
         */
        /**
         * - 已废弃，请参考 {@link dragonBones.Armature#getBones()}。
         * @deprecated
         * @language zh_CN
         */
        getBones() {
            const bones = new Array();
            for (const bone of this._armature.getBones()) {
                if (bone.parent === this) {
                    bones.push(bone);
                }
            }
            return bones;
        }
        /**
         * - Deprecated, please refer to {@link dragonBones.Armature#getSlots()}.
         * @deprecated
         * @language en_US
         */
        /**
         * - 已废弃，请参考 {@link dragonBones.Armature#getSlots()}。
         * @deprecated
         * @language zh_CN
         */
        getSlots() {
            const slots = new Array();
            for (const slot of this._armature.getSlots()) {
                if (slot.parent === this) {
                    slots.push(slot);
                }
            }
            return slots;
        }
        /**
         * - Deprecated, please refer to {@link dragonBones.Armature#getSlot()}.
         * @deprecated
         * @language en_US
         */
        /**
         * - 已废弃，请参考 {@link dragonBones.Armature#getSlot()}。
         * @deprecated
         * @language zh_CN
         */
        get slot() {
            for (const slot of this._armature.getSlots()) {
                if (slot.parent === this) {
                    return slot;
                }
            }
            return null;
        }
    }
    dragonBones.Bone = Bone;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * @internal
     * @private
     */
    class Surface extends dragonBones.Bone {
        constructor() {
            super(...arguments);
            /**
             * For debug draw.
             * @internal
             * @private
             */
            this._vertices = [];
            /**
             * For timeline state.
             * @internal
             * @private
             */
            this._deformVertices = [];
            /**
             * x1, y1, x2, y2, x3, y3, x4, y4, d1X, d1Y, d2X, d2Y
             */
            this._hullCache = [];
            /**
             * Inside [flag, a, b, c, d, tx, ty], Outside [flag, a, b, c, d, tx, ty]
             */
            this._matrixCahce = [];
        }
        static toString() {
            return "[class dragonBones.Surface]";
        }
        /**
         * @inheritDoc
         */
        _onClear() {
            super._onClear();
            this._dX = 0.0;
            this._dY = 0.0;
            this._k = 0.0;
            this._kX = 0.0;
            this._kY = 0.0;
            this._vertices.length = 0;
            this._deformVertices.length = 0;
            this._matrixCahce.length = 0;
            this._hullCache.length = 0;
        }
        _getAffineTransform(x, y, lX, lY, aX, aY, bX, bY, cX, cY, transform, matrix, isDown) {
            const dabX = bX - aX;
            const dabY = bY - aY;
            const dacX = cX - aX;
            const dacY = cY - aY;
            transform.rotation = Math.atan2(dabY, dabX);
            transform.skew = Math.atan2(dacY, dacX) - Math.PI * 0.5 - transform.rotation;
            if (isDown) {
                transform.rotation += Math.PI;
            }
            transform.scaleX = Math.sqrt(dabX * dabX + dabY * dabY) / lX;
            transform.scaleY = Math.sqrt(dacX * dacX + dacY * dacY) / lY;
            transform.toMatrix(matrix);
            transform.x = matrix.tx = aX - (matrix.a * x + matrix.c * y);
            transform.y = matrix.ty = aY - (matrix.b * x + matrix.d * y);
        }
        _updateVertices() {
            const originalVertices = this._boneData.vertices;
            const vertices = this._vertices;
            const animationVertices = this._deformVertices;
            if (this._parent !== null) {
                if (this._parent._boneData.type === 1 /* BoneType.Surface */) {
                    for (let i = 0, l = originalVertices.length; i < l; i += 2) {
                        const x = originalVertices[i] + animationVertices[i];
                        const y = originalVertices[i + 1] + animationVertices[i];
                        const matrix = this._parent._getGlobalTransformMatrix(x, y);
                        //
                        vertices[i] = matrix.a * x + matrix.c * y + matrix.tx;
                        vertices[i + 1] = matrix.b * x + matrix.d * y + matrix.ty;
                    }
                }
                else {
                    const parentMatrix = this._parent.globalTransformMatrix;
                    for (let i = 0, l = originalVertices.length; i < l; i += 2) {
                        const x = originalVertices[i] + animationVertices[i];
                        const y = originalVertices[i + 1] + animationVertices[i + 1];
                        //
                        vertices[i] = parentMatrix.a * x + parentMatrix.c * y + parentMatrix.tx;
                        vertices[i + 1] = parentMatrix.b * x + parentMatrix.d * y + parentMatrix.ty;
                    }
                }
            }
            else {
                for (let i = 0, l = originalVertices.length; i < l; i += 2) {
                    vertices[i] = originalVertices[i] + animationVertices[i];
                    vertices[i + 1] = originalVertices[i + 1] + animationVertices[i + 1];
                }
            }
        }
        /**
         * @private
         */
        _updateGlobalTransformMatrix(isCache) {
            // tslint:disable-next-line:no-unused-expression
            isCache;
            const segmentXD = this._boneData.segmentX * 2;
            const lastIndex = this._vertices.length - 2;
            const lA = 200.0;
            //
            const raX = this._vertices[0];
            const raY = this._vertices[1];
            const rbX = this._vertices[segmentXD];
            const rbY = this._vertices[segmentXD + 1];
            const rcX = this._vertices[lastIndex];
            const rcY = this._vertices[lastIndex + 1];
            const rdX = this._vertices[lastIndex - segmentXD];
            const rdY = this._vertices[lastIndex - segmentXD + 1];
            //
            const dacX = raX + (rcX - raX) * 0.5;
            const dacY = raY + (rcY - raY) * 0.5;
            const dbdX = rbX + (rdX - rbX) * 0.5;
            const dbdY = rbY + (rdY - rbY) * 0.5;
            const aX = dacX + (dbdX - dacX) * 0.5;
            const aY = dacY + (dbdY - dacY) * 0.5;
            const bX = rbX + (rcX - rbX) * 0.5;
            const bY = rbY + (rcY - rbY) * 0.5;
            const cX = rdX + (rcX - rdX) * 0.5;
            const cY = rdY + (rcY - rdY) * 0.5;
            //
            this._globalDirty = false;
            this._getAffineTransform(0.0, 0.0, lA, lA, aX, aY, bX, bY, cX, cY, this.global, this.globalTransformMatrix, false);
        }
        _getGlobalTransformMatrix(x, y) {
            const lB = 1000.0;
            if (x < -lB || lB < x || y < -lB || lB < y) {
                return this.globalTransformMatrix;
            }
            let isDown = false;
            const lA = 200.0;
            const surfaceData = this._boneData;
            const segmentX = surfaceData.segmentX;
            const segmentY = surfaceData.segmentY;
            const segmentXD = surfaceData.segmentX * 2;
            const dX = this._dX;
            const dY = this._dY;
            const indexX = Math.floor((x + lA) / dX);
            const indexY = Math.floor((y + lA) / dY);
            let matrixIndex = 0;
            let pX = indexX * dX - lA;
            let pY = indexY * dY - lA;
            const matrices = this._matrixCahce;
            const helpMatrix = Surface._helpMatrix;
            if (x < -lA) {
                if (y < -lA || y > lA) {
                    return this.globalTransformMatrix;
                }
                isDown = y > this._kX * (x + lA) + pY;
                matrixIndex = ((segmentX * (segmentY + 1) + segmentX * 2 + segmentY + indexY) * 2 + (isDown ? 1 : 0)) * 7;
                if (this._matrixCahce[matrixIndex] > 0.0) {
                    helpMatrix.copyFromArray(matrices, matrixIndex + 1);
                }
                else {
                    const vertexIndex = indexY * (segmentXD + 2);
                    const ddX = this._hullCache[4];
                    const ddY = this._hullCache[5];
                    const sX = this._hullCache[2] - (segmentY - indexY) * ddX;
                    const sY = this._hullCache[3] - (segmentY - indexY) * ddY;
                    const vertices = this._vertices;
                    if (isDown) {
                        this._getAffineTransform(-lA, pY + dY, lB - lA, dY, vertices[vertexIndex + segmentXD + 2], vertices[vertexIndex + segmentXD + 3], sX + ddX, sY + ddY, vertices[vertexIndex], vertices[vertexIndex + 1], Surface._helpTransform, helpMatrix, true);
                    }
                    else {
                        this._getAffineTransform(-lB, pY, lB - lA, dY, sX, sY, vertices[vertexIndex], vertices[vertexIndex + 1], sX + ddX, sY + ddY, Surface._helpTransform, helpMatrix, false);
                    }
                    matrices[matrixIndex] = 1.0;
                    matrices[matrixIndex + 1] = helpMatrix.a;
                    matrices[matrixIndex + 2] = helpMatrix.b;
                    matrices[matrixIndex + 3] = helpMatrix.c;
                    matrices[matrixIndex + 4] = helpMatrix.d;
                    matrices[matrixIndex + 5] = helpMatrix.tx;
                    matrices[matrixIndex + 6] = helpMatrix.ty;
                }
            }
            else if (x > lA) {
                if (y < -lA || y > lA) {
                    return this.globalTransformMatrix;
                }
                isDown = y > this._kX * (x - lB) + pY;
                matrixIndex = ((segmentX * (segmentY + 1) + segmentX + indexY) * 2 + (isDown ? 1 : 0)) * 7;
                if (this._matrixCahce[matrixIndex] > 0.0) {
                    helpMatrix.copyFromArray(matrices, matrixIndex + 1);
                }
                else {
                    const vertexIndex = (indexY + 1) * (segmentXD + 2) - 2;
                    const ddX = this._hullCache[4];
                    const ddY = this._hullCache[5];
                    const sX = this._hullCache[0] + indexY * ddX;
                    const sY = this._hullCache[1] + indexY * ddY;
                    const vertices = this._vertices;
                    if (isDown) {
                        this._getAffineTransform(lB, pY + dY, lB - lA, dY, sX + ddX, sY + ddY, vertices[vertexIndex + segmentXD + 2], vertices[vertexIndex + segmentXD + 3], sX, sY, Surface._helpTransform, helpMatrix, true);
                    }
                    else {
                        this._getAffineTransform(lA, pY, lB - lA, dY, vertices[vertexIndex], vertices[vertexIndex + 1], sX, sY, vertices[vertexIndex + segmentXD + 2], vertices[vertexIndex + segmentXD + 3], Surface._helpTransform, helpMatrix, false);
                    }
                    matrices[matrixIndex] = 1.0;
                    matrices[matrixIndex + 1] = helpMatrix.a;
                    matrices[matrixIndex + 2] = helpMatrix.b;
                    matrices[matrixIndex + 3] = helpMatrix.c;
                    matrices[matrixIndex + 4] = helpMatrix.d;
                    matrices[matrixIndex + 5] = helpMatrix.tx;
                    matrices[matrixIndex + 6] = helpMatrix.ty;
                }
            }
            else if (y < -lA) {
                if (x < -lA || x > lA) {
                    return this.globalTransformMatrix;
                }
                isDown = y > this._kY * (x - pX - dX) - lB;
                matrixIndex = (segmentX * (segmentY + 1) + indexX * 2 + (isDown ? 1 : 0)) * 7;
                if (this._matrixCahce[matrixIndex] > 0.0) {
                    helpMatrix.copyFromArray(matrices, matrixIndex + 1);
                }
                else {
                    const vertexIndex = indexX * 2;
                    const ddX = this._hullCache[10];
                    const ddY = this._hullCache[11];
                    const sX = this._hullCache[8] + indexX * ddX;
                    const sY = this._hullCache[9] + indexX * ddY;
                    const vertices = this._vertices;
                    if (isDown) {
                        this._getAffineTransform(pX + dX, -lA, dX, lB - lA, vertices[vertexIndex + 2], vertices[vertexIndex + 3], vertices[vertexIndex], vertices[vertexIndex + 1], sX + ddX, sY + ddY, Surface._helpTransform, helpMatrix, true);
                    }
                    else {
                        this._getAffineTransform(pX, -lB, dX, lB - lA, sX, sY, sX + ddX, sY + ddY, vertices[vertexIndex], vertices[vertexIndex + 1], Surface._helpTransform, helpMatrix, false);
                    }
                    matrices[matrixIndex] = 1.0;
                    matrices[matrixIndex + 1] = helpMatrix.a;
                    matrices[matrixIndex + 2] = helpMatrix.b;
                    matrices[matrixIndex + 3] = helpMatrix.c;
                    matrices[matrixIndex + 4] = helpMatrix.d;
                    matrices[matrixIndex + 5] = helpMatrix.tx;
                    matrices[matrixIndex + 6] = helpMatrix.ty;
                }
            }
            else if (y > lA) {
                if (x < -lA || x > lA) {
                    return this.globalTransformMatrix;
                }
                isDown = y > this._kY * (x - pX - dX) + lA;
                matrixIndex = ((segmentX * (segmentY + 1) + segmentX + segmentY + indexY) * 2 + (isDown ? 1 : 0)) * 7;
                if (this._matrixCahce[matrixIndex] > 0.0) {
                    helpMatrix.copyFromArray(matrices, matrixIndex + 1);
                }
                else {
                    const vertexIndex = segmentY * (segmentXD + 2) + indexX * 2;
                    const ddX = this._hullCache[10];
                    const ddY = this._hullCache[11];
                    const sX = this._hullCache[6] - (segmentX - indexX) * ddX;
                    const sY = this._hullCache[7] - (segmentX - indexX) * ddY;
                    const vertices = this._vertices;
                    if (isDown) {
                        this._getAffineTransform(pX + dX, lB, dX, lB - lA, sX + ddX, sY + ddY, sX, sY, vertices[vertexIndex + 2], vertices[vertexIndex + 3], Surface._helpTransform, helpMatrix, true);
                    }
                    else {
                        this._getAffineTransform(pX, lA, dX, lB - lA, vertices[vertexIndex], vertices[vertexIndex + 1], vertices[vertexIndex + 2], vertices[vertexIndex + 3], sX, sY, Surface._helpTransform, helpMatrix, false);
                    }
                    matrices[matrixIndex] = 1.0;
                    matrices[matrixIndex + 1] = helpMatrix.a;
                    matrices[matrixIndex + 2] = helpMatrix.b;
                    matrices[matrixIndex + 3] = helpMatrix.c;
                    matrices[matrixIndex + 4] = helpMatrix.d;
                    matrices[matrixIndex + 5] = helpMatrix.tx;
                    matrices[matrixIndex + 6] = helpMatrix.ty;
                }
            }
            else {
                isDown = y > this._k * (x - pX - dX) + pY;
                matrixIndex = ((segmentX * indexY + indexX) * 2 + (isDown ? 1 : 0)) * 7;
                if (this._matrixCahce[matrixIndex] > 0.0) {
                    helpMatrix.copyFromArray(matrices, matrixIndex + 1);
                }
                else {
                    const vertexIndex = indexX * 2 + indexY * (segmentXD + 2);
                    const vertices = this._vertices;
                    if (isDown) {
                        this._getAffineTransform(pX + dX, pY + dY, dX, dY, vertices[vertexIndex + segmentXD + 4], vertices[vertexIndex + segmentXD + 5], vertices[vertexIndex + segmentXD + 2], vertices[vertexIndex + segmentXD + 3], vertices[vertexIndex + 2], vertices[vertexIndex + 3], Surface._helpTransform, helpMatrix, true);
                    }
                    else {
                        this._getAffineTransform(pX, pY, dX, dY, vertices[vertexIndex], vertices[vertexIndex + 1], vertices[vertexIndex + 2], vertices[vertexIndex + 3], vertices[vertexIndex + segmentXD + 2], vertices[vertexIndex + segmentXD + 3], Surface._helpTransform, helpMatrix, false);
                    }
                    matrices[matrixIndex] = 1.0;
                    matrices[matrixIndex + 1] = helpMatrix.a;
                    matrices[matrixIndex + 2] = helpMatrix.b;
                    matrices[matrixIndex + 3] = helpMatrix.c;
                    matrices[matrixIndex + 4] = helpMatrix.d;
                    matrices[matrixIndex + 5] = helpMatrix.tx;
                    matrices[matrixIndex + 6] = helpMatrix.ty;
                }
            }
            return helpMatrix;
        }
        init(surfaceData) {
            if (this._boneData !== null) {
                return;
            }
            super.init(surfaceData);
            const segmentX = surfaceData.segmentX;
            const segmentY = surfaceData.segmentY;
            const vertexCount = surfaceData.vertices.length;
            const lB = 1000.0;
            const lA = 200.0;
            //
            this._dX = lA * 2.0 / segmentX;
            this._dY = lA * 2.0 / segmentY;
            this._k = -this._dY / this._dX;
            this._kX = -this._dY / (lB - lA);
            this._kY = -(lB - lA) / this._dX;
            this._vertices.length = vertexCount;
            this._deformVertices.length = vertexCount;
            this._matrixCahce.length = (segmentX * segmentY + segmentX * 2 + segmentY * 2) * 2 * 7;
            this._hullCache.length = 10;
            for (let i = 0; i < vertexCount; ++i) {
                this._deformVertices[i] = 0.0;
            }
        }
        /**
         * @internal
         * @private
         */
        update(cacheFrameIndex) {
            this._blendState.dirty = false;
            if (cacheFrameIndex >= 0 && this._cachedFrameIndices !== null) {
                const cachedFrameIndex = this._cachedFrameIndices[cacheFrameIndex];
                if (cachedFrameIndex >= 0 && this._cachedFrameIndex === cachedFrameIndex) { // Same cache.
                    this._transformDirty = false;
                }
                else if (cachedFrameIndex >= 0) { // Has been Cached.
                    this._transformDirty = true;
                    this._cachedFrameIndex = cachedFrameIndex;
                }
                else {
                    if (this._hasConstraint) { // Update constraints.
                        for (const constraint of this._armature._constraints) {
                            if (constraint._root === this) {
                                constraint.update();
                            }
                        }
                    }
                    if (this._transformDirty ||
                        (this._parent !== null && this._parent._childrenTransformDirty)) { // Dirty.
                        this._transformDirty = true;
                        this._cachedFrameIndex = -1;
                    }
                    else if (this._cachedFrameIndex >= 0) { // Same cache, but not set index yet.
                        this._transformDirty = false;
                        this._cachedFrameIndices[cacheFrameIndex] = this._cachedFrameIndex;
                    }
                    else { // Dirty.
                        this._transformDirty = true;
                        this._cachedFrameIndex = -1;
                    }
                }
            }
            else {
                if (this._hasConstraint) { // Update constraints.
                    for (const constraint of this._armature._constraints) {
                        if (constraint._root === this) {
                            constraint.update();
                        }
                    }
                }
                if (this._transformDirty || (this._parent !== null && this._parent._childrenTransformDirty)) { // Dirty.
                    cacheFrameIndex = -1;
                    this._transformDirty = true;
                    this._cachedFrameIndex = -1;
                }
            }
            if (this._transformDirty) {
                this._transformDirty = false;
                this._childrenTransformDirty = true;
                //
                for (let i = 0, l = this._matrixCahce.length; i < l; i += 7) {
                    this._matrixCahce[i] = -1.0;
                }
                //
                this._updateVertices();
                //
                if (this._cachedFrameIndex < 0) {
                    const isCache = cacheFrameIndex >= 0;
                    if (this._localDirty) {
                        this._updateGlobalTransformMatrix(isCache);
                    }
                    if (isCache && this._cachedFrameIndices !== null) {
                        this._cachedFrameIndex = this._cachedFrameIndices[cacheFrameIndex] = this._armature._armatureData.setCacheFrame(this.globalTransformMatrix, this.global);
                    }
                }
                else {
                    this._armature._armatureData.getCacheFrame(this.globalTransformMatrix, this.global, this._cachedFrameIndex);
                }
                // Update hull vertices.
                const lB = 1000.0;
                const lA = 200.0;
                const ddX = 2 * this.global.x;
                const ddY = 2 * this.global.y;
                //
                const helpPoint = Surface._helpPoint;
                this.globalTransformMatrix.transformPoint(lB, -lA, helpPoint);
                this._hullCache[0] = helpPoint.x;
                this._hullCache[1] = helpPoint.y;
                this._hullCache[2] = ddX - helpPoint.x;
                this._hullCache[3] = ddY - helpPoint.y;
                this.globalTransformMatrix.transformPoint(0.0, this._dY, helpPoint, true);
                this._hullCache[4] = helpPoint.x;
                this._hullCache[5] = helpPoint.y;
                //
                this.globalTransformMatrix.transformPoint(lA, lB, helpPoint);
                this._hullCache[6] = helpPoint.x;
                this._hullCache[7] = helpPoint.y;
                this._hullCache[8] = ddX - helpPoint.x;
                this._hullCache[9] = ddY - helpPoint.y;
                this.globalTransformMatrix.transformPoint(this._dX, 0.0, helpPoint, true);
                this._hullCache[10] = helpPoint.x;
                this._hullCache[11] = helpPoint.y;
            }
            else if (this._childrenTransformDirty) {
                this._childrenTransformDirty = false;
            }
            this._localDirty = true;
        }
    }
    dragonBones.Surface = Surface;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * - The slot attached to the armature, controls the display status and properties of the display object.
     * A bone can contain multiple slots.
     * A slot can contain multiple display objects, displaying only one of the display objects at a time,
     * but you can toggle the display object into frame animation while the animation is playing.
     * The display object can be a normal texture, or it can be a display of a child armature, a grid display object,
     * and a custom other display object.
     * @see dragonBones.Armature
     * @see dragonBones.Bone
     * @see dragonBones.SlotData
     * @version DragonBones 3.0
     * @language en_US
     */
    /**
     * - 插槽附着在骨骼上，控制显示对象的显示状态和属性。
     * 一个骨骼上可以包含多个插槽。
     * 一个插槽中可以包含多个显示对象，同一时间只能显示其中的一个显示对象，但可以在动画播放的过程中切换显示对象实现帧动画。
     * 显示对象可以是普通的图片纹理，也可以是子骨架的显示容器，网格显示对象，还可以是自定义的其他显示对象。
     * @see dragonBones.Armature
     * @see dragonBones.Bone
     * @see dragonBones.SlotData
     * @version DragonBones 3.0
     * @language zh_CN
     */
    class Slot extends dragonBones.TransformObject {
        constructor() {
            super(...arguments);
            /**
             * @private
             */
            this._localMatrix = new dragonBones.Matrix();
            /**
             * @internal
             * @private
             */
            this._colorTransform = new dragonBones.ColorTransform();
            /**
             * @internal
             * @private
             */
            this._deformVertices = [];
            /**
             * @private
             */
            this._displayDatas = [];
            /**
             * @private
             */
            this._displayList = [];
            /**
             * @private
             */
            this._meshBones = [];
            /**
             * @private
             */
            this._meshSlots = [];
            /**
             * @private
             */
            this._rawDisplay = null; // Initial value.
            /**
             * @private
             */
            this._meshDisplay = null; // Initial value.
        }
        /**
         * @inheritDoc
         */
        _onClear() {
            super._onClear();
            const disposeDisplayList = [];
            for (const eachDisplay of this._displayList) {
                if (eachDisplay !== null && eachDisplay !== this._rawDisplay && eachDisplay !== this._meshDisplay &&
                    disposeDisplayList.indexOf(eachDisplay) < 0) {
                    disposeDisplayList.push(eachDisplay);
                }
            }
            for (const eachDisplay of disposeDisplayList) {
                if (eachDisplay instanceof dragonBones.Armature) {
                    eachDisplay.dispose();
                }
                else {
                    this._disposeDisplay(eachDisplay, false);
                }
            }
            if (this._meshDisplay !== null && this._meshDisplay !== this._rawDisplay) { // May be _meshDisplay and _rawDisplay is the same one.
                this._disposeDisplay(this._meshDisplay, false);
            }
            if (this._rawDisplay !== null) {
                this._disposeDisplay(this._rawDisplay, false);
            }
            this.displayController = null;
            this._displayDirty = false;
            this._zOrderDirty = false;
            this._blendModeDirty = false;
            this._colorDirty = false;
            this._meshDirty = false;
            this._transformDirty = false;
            this._visible = true;
            this._blendMode = 0 /* BlendMode.Normal */;
            this._displayIndex = -1;
            this._animationDisplayIndex = -1;
            this._zOrder = 0;
            this._cachedFrameIndex = -1;
            this._pivotX = 0.0;
            this._pivotY = 0.0;
            this._localMatrix.identity();
            this._colorTransform.identity();
            this._deformVertices.length = 0;
            this._displayList.length = 0;
            this._displayDatas.length = 0;
            this._meshBones.length = 0;
            this._meshSlots.length = 0;
            this._slotData = null; //
            this._rawDisplayDatas = null;
            this._displayData = null;
            this._textureData = null;
            this._meshData = null;
            this._boundingBoxData = null;
            this._rawDisplay = null;
            this._meshDisplay = null;
            this._display = null;
            this._childArmature = null;
            this._cachedFrameIndices = null;
        }
        /**
         * @private
         */
        _isMeshBonesUpdate() {
            for (const bone of this._meshBones) {
                if (bone !== null && bone._childrenTransformDirty) {
                    return true;
                }
            }
            return false;
        }
        /**
         * Support default skin data.
         * @private
         */
        _getDefaultRawDisplayData(displayIndex) {
            const defaultSkin = this._armature._armatureData.defaultSkin;
            if (defaultSkin !== null) {
                const defaultRawDisplayDatas = defaultSkin.getDisplays(this._slotData.name);
                if (defaultRawDisplayDatas !== null) {
                    return displayIndex < defaultRawDisplayDatas.length ? defaultRawDisplayDatas[displayIndex] : null;
                }
            }
            return null;
        }
        /**
         * @private
         */
        _updateDisplayData() {
            const prevDisplayData = this._displayData;
            const prevTextureData = this._textureData;
            const prevMeshData = this._meshData;
            let rawDisplayData = null;
            if (this._displayIndex >= 0) {
                if (this._rawDisplayDatas !== null) {
                    rawDisplayData = this._displayIndex < this._rawDisplayDatas.length ? this._rawDisplayDatas[this._displayIndex] : null;
                }
                if (rawDisplayData === null) {
                    rawDisplayData = this._getDefaultRawDisplayData(this._displayIndex);
                }
                if (this._displayIndex < this._displayDatas.length) {
                    this._displayData = this._displayDatas[this._displayIndex];
                }
            }
            else {
                rawDisplayData = null;
                this._displayData = null;
            }
            // Update texture and mesh data.
            if (this._displayData !== null) {
                if (this._displayData.type === 0 /* DisplayType.Image */ || this._displayData.type === 2 /* DisplayType.Mesh */) {
                    if (this._displayData.type === 2 /* DisplayType.Mesh */) {
                        this._textureData = this._displayData.texture;
                        this._meshData = this._displayData;
                    }
                    else if (rawDisplayData !== null && rawDisplayData.type === 2 /* DisplayType.Mesh */) {
                        this._textureData = this._displayData.texture;
                        this._meshData = rawDisplayData;
                    }
                    else {
                        this._textureData = this._displayData.texture;
                        this._meshData = null;
                    }
                }
                else {
                    this._textureData = null;
                    this._meshData = null;
                }
            }
            else {
                this._textureData = null;
                this._meshData = null;
            }
            // Update bounding box data.
            if (this._displayData !== null && this._displayData.type === 3 /* DisplayType.BoundingBox */) {
                this._boundingBoxData = this._displayData.boundingBox;
            }
            else if (rawDisplayData !== null && rawDisplayData.type === 3 /* DisplayType.BoundingBox */) {
                this._boundingBoxData = rawDisplayData.boundingBox;
            }
            else {
                this._boundingBoxData = null;
            }
            if (this._displayData !== prevDisplayData || this._textureData !== prevTextureData || this._meshData !== prevMeshData) {
                // Update pivot offset.
                if (this._meshData !== null) {
                    this._pivotX = 0.0;
                    this._pivotY = 0.0;
                }
                else if (this._textureData !== null) {
                    const imageDisplayData = this._displayData;
                    const scale = this._textureData.parent.scale * this._armature._armatureData.scale;
                    const frame = this._textureData.frame;
                    this._pivotX = imageDisplayData.pivot.x;
                    this._pivotY = imageDisplayData.pivot.y;
                    const rect = frame !== null ? frame : this._textureData.region;
                    let width = rect.width;
                    let height = rect.height;
                    if (this._textureData.rotated && frame === null) {
                        width = rect.height;
                        height = rect.width;
                    }
                    this._pivotX *= width * scale;
                    this._pivotY *= height * scale;
                    if (frame !== null) {
                        this._pivotX += frame.x * scale;
                        this._pivotY += frame.y * scale;
                    }
                }
                else {
                    this._pivotX = 0.0;
                    this._pivotY = 0.0;
                }
                // Update replace pivot.
                if (this._displayData !== null && rawDisplayData !== null && this._displayData !== rawDisplayData && this._meshData === null) {
                    rawDisplayData.transform.toMatrix(Slot._helpMatrix);
                    Slot._helpMatrix.invert();
                    Slot._helpMatrix.transformPoint(0.0, 0.0, Slot._helpPoint);
                    this._pivotX -= Slot._helpPoint.x;
                    this._pivotY -= Slot._helpPoint.y;
                    this._displayData.transform.toMatrix(Slot._helpMatrix);
                    Slot._helpMatrix.invert();
                    Slot._helpMatrix.transformPoint(0.0, 0.0, Slot._helpPoint);
                    this._pivotX += Slot._helpPoint.x;
                    this._pivotY += Slot._helpPoint.y;
                }
                // Update original transform.
                if (rawDisplayData !== null) { // Compatible.
                    this.origin = rawDisplayData.transform;
                }
                else if (this._displayData !== null) { // Compatible.
                    this.origin = this._displayData.transform;
                }
                else {
                    this.origin = null;
                }
                // Update mesh bones and deform vertices.
                if (this._meshData !== prevMeshData) {
                    if (this._meshData !== null) { // && this._meshData === this._displayData
                        // Update skined mesh.
                        if (this._meshData.weight !== null) {
                            this._deformVertices.length = this._meshData.weight.count * 2;
                            this._meshBones.length = this._meshData.weight.bones.length;
                            for (let i = 0, l = this._meshBones.length; i < l; ++i) {
                                this._meshBones[i] = this._armature.getBone(this._meshData.weight.bones[i].name);
                            }
                        }
                        else {
                            const vertexCount = this._meshData.parent.parent.parent.intArray[this._meshData.offset + 0 /* BinaryOffset.MeshVertexCount */];
                            this._deformVertices.length = vertexCount * 2;
                            this._meshBones.length = 0;
                        }
                        // Update glue mesh.
                        const armatureGlueSlots = this._armature._glueSlots;
                        if (this._meshData.glue !== null) {
                            this._meshSlots.length = this._meshData.glue.meshes.length;
                            for (let i = 0, l = this._meshSlots.length; i < l; ++i) {
                                const mesh = this._meshData.glue.meshes[i];
                                if (mesh !== null) {
                                    let flag = false;
                                    for (const slot of this._armature.getSlots()) {
                                        for (const displayData of slot._displayDatas) {
                                            if (displayData !== null &&
                                                displayData.type === 2 /* DisplayType.Mesh */ &&
                                                displayData.offset === mesh.offset) {
                                                flag = true;
                                                this._meshSlots[i] = slot;
                                                break;
                                            }
                                        }
                                        if (flag) {
                                            break;
                                        }
                                    }
                                    if (!flag) {
                                        this._meshSlots[i] = null;
                                    }
                                }
                                else {
                                    this._meshSlots[i] = null;
                                }
                            }
                            if (armatureGlueSlots.indexOf(this) < 0) {
                                armatureGlueSlots.push(this);
                            }
                        }
                        else {
                            const index = armatureGlueSlots.indexOf(this);
                            if (index >= 0) {
                                armatureGlueSlots.slice(index, 1);
                            }
                        }
                        // Clear deform to zero.
                        for (let i = 0, l = this._deformVertices.length; i < l; ++i) {
                            this._deformVertices[i] = 0.0;
                        }
                        this._meshDirty = true;
                    }
                    else {
                        this._deformVertices.length = 0;
                        this._meshBones.length = 0;
                        this._meshSlots.length = 0;
                    }
                }
                else if (this._meshData !== null && this._textureData !== prevTextureData) { // Update mesh after update frame.
                    this._meshDirty = true;
                }
                this._displayDirty = true;
                this._transformDirty = true;
            }
        }
        /**
         * @private
         */
        _updateDisplay() {
            const prevDisplay = this._display !== null ? this._display : this._rawDisplay;
            const prevChildArmature = this._childArmature;
            // Update display and child armature.
            if (this._displayIndex >= 0 && this._displayIndex < this._displayList.length) {
                this._display = this._displayList[this._displayIndex];
                if (this._display !== null && this._display instanceof dragonBones.Armature) {
                    this._childArmature = this._display;
                    this._display = this._childArmature.display;
                }
                else {
                    this._childArmature = null;
                }
            }
            else {
                this._display = null;
                this._childArmature = null;
            }
            // Update display.
            const currentDisplay = this._display !== null ? this._display : this._rawDisplay;
            if (currentDisplay !== prevDisplay) {
                this._onUpdateDisplay();
                this._replaceDisplay(prevDisplay);
                this._visibleDirty = true;
                this._blendModeDirty = true;
                this._colorDirty = true;
            }
            // Update frame.
            if (currentDisplay === this._rawDisplay || currentDisplay === this._meshDisplay) {
                this._updateFrame();
            }
            // Update child armature.
            if (this._childArmature !== prevChildArmature) {
                if (prevChildArmature !== null) {
                    prevChildArmature._parent = null; // Update child armature parent.
                    prevChildArmature.clock = null;
                    if (prevChildArmature.inheritAnimation) {
                        prevChildArmature.animation.reset();
                    }
                }
                if (this._childArmature !== null) {
                    this._childArmature._parent = this; // Update child armature parent.
                    this._childArmature.clock = this._armature.clock;
                    if (this._childArmature.inheritAnimation) { // Set child armature cache frameRate.
                        if (this._childArmature.cacheFrameRate === 0) {
                            const cacheFrameRate = this._armature.cacheFrameRate;
                            if (cacheFrameRate !== 0) {
                                this._childArmature.cacheFrameRate = cacheFrameRate;
                            }
                        }
                        // Child armature action.
                        let actions = null;
                        if (this._displayData !== null && this._displayData.type === 1 /* DisplayType.Armature */) {
                            actions = this._displayData.actions;
                        }
                        else if (this._displayIndex >= 0 && this._rawDisplayDatas !== null) {
                            let rawDisplayData = this._displayIndex < this._rawDisplayDatas.length ? this._rawDisplayDatas[this._displayIndex] : null;
                            if (rawDisplayData === null) {
                                rawDisplayData = this._getDefaultRawDisplayData(this._displayIndex);
                            }
                            if (rawDisplayData !== null && rawDisplayData.type === 1 /* DisplayType.Armature */) {
                                actions = rawDisplayData.actions;
                            }
                        }
                        if (actions !== null && actions.length > 0) {
                            for (const action of actions) {
                                this._childArmature._bufferAction(action, false); // Make sure default action at the beginning.
                            }
                        }
                        else {
                            this._childArmature.animation.play();
                        }
                    }
                }
            }
        }
        /**
         * @private
         */
        _updateGlobalTransformMatrix(isCache) {
            const parentMatrix = this._parent._boneData.type === 0 /* BoneType.Bone */ ? this._parent.globalTransformMatrix : this._parent._getGlobalTransformMatrix(this.global.x, this.global.y);
            this.globalTransformMatrix.copyFrom(this._localMatrix);
            this.globalTransformMatrix.concat(parentMatrix);
            if (isCache) {
                this.global.fromMatrix(this.globalTransformMatrix);
            }
            else {
                this._globalDirty = true;
            }
        }
        /**
         * @inheritDoc
         */
        _setArmature(value) {
            if (this._armature === value) {
                return;
            }
            if (this._armature !== null) {
                this._armature._removeSlotFromSlotList(this);
            }
            this._armature = value; //
            this._onUpdateDisplay();
            if (this._armature !== null) {
                this._armature._addSlotToSlotList(this);
                this._addDisplay();
            }
            else {
                this._removeDisplay();
            }
        }
        /**
         * @internal
         * @private
         */
        _setDisplayIndex(value, isAnimation = false) {
            if (isAnimation) {
                if (this._animationDisplayIndex === value) {
                    return false;
                }
                this._animationDisplayIndex = value;
            }
            if (this._displayIndex === value) {
                return false;
            }
            this._displayIndex = value;
            this._displayDirty = true;
            this._updateDisplayData();
            return this._displayDirty;
        }
        /**
         * @internal
         * @private
         */
        _setZorder(value) {
            if (this._zOrder === value) {
                //return false;
            }
            this._zOrder = value;
            this._zOrderDirty = true;
            return this._zOrderDirty;
        }
        /**
         * @internal
         * @private
         */
        _setColor(value) {
            this._colorTransform.copyFrom(value);
            this._colorDirty = true;
            return this._colorDirty;
        }
        /**
         * @internal
         * @private
         */
        _setDisplayList(value) {
            if (value !== null && value.length > 0) {
                if (this._displayList.length !== value.length) {
                    this._displayList.length = value.length;
                }
                for (let i = 0, l = value.length; i < l; ++i) { // Retain input render displays.
                    const eachDisplay = value[i];
                    if (eachDisplay !== null && eachDisplay !== this._rawDisplay && eachDisplay !== this._meshDisplay &&
                        !(eachDisplay instanceof dragonBones.Armature) && this._displayList.indexOf(eachDisplay) < 0) {
                        this._initDisplay(eachDisplay, true);
                    }
                    this._displayList[i] = eachDisplay;
                }
            }
            else if (this._displayList.length > 0) {
                this._displayList.length = 0;
            }
            if (this._displayIndex >= 0 && this._displayIndex < this._displayList.length) {
                this._displayDirty = this._display !== this._displayList[this._displayIndex];
            }
            else {
                this._displayDirty = this._display !== null;
            }
            this._updateDisplayData();
            return this._displayDirty;
        }
        /**
         * @internal
         * @private
         */
        init(slotData, displayDatas, rawDisplay, meshDisplay) {
            if (this._slotData !== null) {
                return;
            }
            this._slotData = slotData;
            //
            this._visibleDirty = true;
            this._blendModeDirty = true;
            this._colorDirty = true;
            this._blendMode = this._slotData.blendMode;
            this._zOrder = this._slotData.zOrder;
            this._colorTransform.copyFrom(this._slotData.color);
            this._rawDisplay = rawDisplay;
            this._meshDisplay = meshDisplay;
            //
            this.rawDisplayDatas = displayDatas; //
            //
            this._initDisplay(this._rawDisplay, false);
            if (this._rawDisplay !== this._meshDisplay) {
                this._initDisplay(this._meshDisplay, false);
            }
        }
        /**
         * @internal
         * @private
         */
        update(cacheFrameIndex) {
            if (this._displayDirty) {
                this._displayDirty = false;
                this._updateDisplay();
                // TODO remove slot offset.
                if (this._transformDirty) { // Update local matrix. (Only updated when both display and transform are dirty.)
                    if (this.origin !== null) {
                        this.global.copyFrom(this.origin).add(this.offset).toMatrix(this._localMatrix);
                    }
                    else {
                        this.global.copyFrom(this.offset).toMatrix(this._localMatrix);
                    }
                }
            }
            if (this._zOrderDirty) {
                this._zOrderDirty = false;
                this._updateZOrder();
            }
            if (cacheFrameIndex >= 0 && this._cachedFrameIndices !== null) {
                const cachedFrameIndex = this._cachedFrameIndices[cacheFrameIndex];
                if (cachedFrameIndex >= 0 && this._cachedFrameIndex === cachedFrameIndex) { // Same cache.
                    this._transformDirty = false;
                }
                else if (cachedFrameIndex >= 0) { // Has been Cached.
                    this._transformDirty = true;
                    this._cachedFrameIndex = cachedFrameIndex;
                }
                else if (this._transformDirty || this._parent._childrenTransformDirty) { // Dirty.
                    this._transformDirty = true;
                    this._cachedFrameIndex = -1;
                }
                else if (this._cachedFrameIndex >= 0) { // Same cache, but not set index yet.
                    this._transformDirty = false;
                    this._cachedFrameIndices[cacheFrameIndex] = this._cachedFrameIndex;
                }
                else { // Dirty.
                    this._transformDirty = true;
                    this._cachedFrameIndex = -1;
                }
            }
            else if (this._transformDirty || this._parent._childrenTransformDirty) { // Dirty.
                cacheFrameIndex = -1;
                this._transformDirty = true;
                this._cachedFrameIndex = -1;
            }
            if (this._display === null) {
                return;
            }
            if (this._visibleDirty) {
                this._visibleDirty = false;
                this._updateVisible();
            }
            if (this._blendModeDirty) {
                this._blendModeDirty = false;
                this._updateBlendMode();
            }
            if (this._colorDirty) {
                this._colorDirty = false;
                this._updateColor();
            }
            if (this._meshData !== null && this._display === this._meshDisplay) {
                const isSkinned = this._meshData.weight !== null;
                const isSurface = this._parent._boneData.type !== 0 /* BoneType.Bone */;
                const isGule = this._meshData.glue !== null;
                if (this._meshDirty ||
                    (isSkinned && this._isMeshBonesUpdate()) ||
                    (isSurface && this._parent._childrenTransformDirty) ||
                    (isGule && this._parent._childrenTransformDirty) // TODO
                ) {
                    this._meshDirty = false;
                    this._updateMesh();
                }
                if (isSkinned || isSurface || isGule) {
                    return;
                }
            }
            if (this._transformDirty) {
                this._transformDirty = false;
                if (this._cachedFrameIndex < 0) {
                    const isCache = cacheFrameIndex >= 0;
                    this._updateGlobalTransformMatrix(isCache);
                    if (isCache && this._cachedFrameIndices !== null) {
                        this._cachedFrameIndex = this._cachedFrameIndices[cacheFrameIndex] = this._armature._armatureData.setCacheFrame(this.globalTransformMatrix, this.global);
                    }
                }
                else {
                    this._armature._armatureData.getCacheFrame(this.globalTransformMatrix, this.global, this._cachedFrameIndex);
                }
                this._updateTransform();
            }
        }
        /**
         * @private
         */
        updateTransformAndMatrix() {
            if (this._transformDirty) {
                this._transformDirty = false;
                this._updateGlobalTransformMatrix(false);
            }
        }
        /**
         * @private
         */
        replaceDisplayData(value, displayIndex = -1) {
            if (displayIndex < 0) {
                if (this._displayIndex < 0) {
                    displayIndex = 0;
                }
                else {
                    displayIndex = this._displayIndex;
                }
            }
            if (this._displayDatas.length <= displayIndex) {
                this._displayDatas.length = displayIndex + 1;
                for (let i = 0, l = this._displayDatas.length; i < l; ++i) { // Clean undefined.
                    if (!this._displayDatas[i]) {
                        this._displayDatas[i] = null;
                    }
                }
            }
            this._displayDatas[displayIndex] = value;
        }
        /**
         * - Check whether a specific point is inside a custom bounding box in the slot.
         * The coordinate system of the point is the inner coordinate system of the armature.
         * Custom bounding boxes need to be customized in Dragonbones Pro.
         * @param x - The horizontal coordinate of the point.
         * @param y - The vertical coordinate of the point.
         * @version DragonBones 5.0
         * @language en_US
         */
        /**
         * - 检查特定点是否在插槽的自定义边界框内。
         * 点的坐标系为骨架内坐标系。
         * 自定义边界框需要在 DragonBones Pro 中自定义。
         * @param x - 点的水平坐标。
         * @param y - 点的垂直坐标。
         * @version DragonBones 5.0
         * @language zh_CN
         */
        containsPoint(x, y) {
            if (this._boundingBoxData === null) {
                return false;
            }
            this.updateTransformAndMatrix();
            Slot._helpMatrix.copyFrom(this.globalTransformMatrix);
            Slot._helpMatrix.invert();
            Slot._helpMatrix.transformPoint(x, y, Slot._helpPoint);
            return this._boundingBoxData.containsPoint(Slot._helpPoint.x, Slot._helpPoint.y);
        }
        /**
         * - Check whether a specific segment intersects a custom bounding box for the slot.
         * The coordinate system of the segment and intersection is the inner coordinate system of the armature.
         * Custom bounding boxes need to be customized in Dragonbones Pro.
         * @param xA - The horizontal coordinate of the beginning of the segment.
         * @param yA - The vertical coordinate of the beginning of the segment.
         * @param xB - The horizontal coordinate of the end point of the segment.
         * @param yB - The vertical coordinate of the end point of the segment.
         * @param intersectionPointA - The first intersection at which a line segment intersects the bounding box from the beginning to the end. (If not set, the intersection point will not calculated)
         * @param intersectionPointB - The first intersection at which a line segment intersects the bounding box from the end to the beginning. (If not set, the intersection point will not calculated)
         * @param normalRadians - The normal radians of the tangent of the intersection boundary box. [x: Normal radian of the first intersection tangent, y: Normal radian of the second intersection tangent] (If not set, the normal will not calculated)
         * @returns Intersection situation. [1: Disjoint and segments within the bounding box, 0: Disjoint, 1: Intersecting and having a nodal point and ending in the bounding box, 2: Intersecting and having a nodal point and starting at the bounding box, 3: Intersecting and having two intersections, N: Intersecting and having N intersections]
         * @version DragonBones 5.0
         * @language en_US
         */
        /**
         * - 检查特定线段是否与插槽的自定义边界框相交。
         * 线段和交点的坐标系均为骨架内坐标系。
         * 自定义边界框需要在 DragonBones Pro 中自定义。
         * @param xA - 线段起点的水平坐标。
         * @param yA - 线段起点的垂直坐标。
         * @param xB - 线段终点的水平坐标。
         * @param yB - 线段终点的垂直坐标。
         * @param intersectionPointA - 线段从起点到终点与边界框相交的第一个交点。 （如果未设置，则不计算交点）
         * @param intersectionPointB - 线段从终点到起点与边界框相交的第一个交点。 （如果未设置，则不计算交点）
         * @param normalRadians - 交点边界框切线的法线弧度。 [x: 第一个交点切线的法线弧度, y: 第二个交点切线的法线弧度] （如果未设置，则不计算法线）
         * @returns 相交的情况。 [-1: 不相交且线段在包围盒内, 0: 不相交, 1: 相交且有一个交点且终点在包围盒内, 2: 相交且有一个交点且起点在包围盒内, 3: 相交且有两个交点, N: 相交且有 N 个交点]
         * @version DragonBones 5.0
         * @language zh_CN
         */
        intersectsSegment(xA, yA, xB, yB, intersectionPointA = null, intersectionPointB = null, normalRadians = null) {
            if (this._boundingBoxData === null) {
                return 0;
            }
            this.updateTransformAndMatrix();
            Slot._helpMatrix.copyFrom(this.globalTransformMatrix);
            Slot._helpMatrix.invert();
            Slot._helpMatrix.transformPoint(xA, yA, Slot._helpPoint);
            xA = Slot._helpPoint.x;
            yA = Slot._helpPoint.y;
            Slot._helpMatrix.transformPoint(xB, yB, Slot._helpPoint);
            xB = Slot._helpPoint.x;
            yB = Slot._helpPoint.y;
            const intersectionCount = this._boundingBoxData.intersectsSegment(xA, yA, xB, yB, intersectionPointA, intersectionPointB, normalRadians);
            if (intersectionCount > 0) {
                if (intersectionCount === 1 || intersectionCount === 2) {
                    if (intersectionPointA !== null) {
                        this.globalTransformMatrix.transformPoint(intersectionPointA.x, intersectionPointA.y, intersectionPointA);
                        if (intersectionPointB !== null) {
                            intersectionPointB.x = intersectionPointA.x;
                            intersectionPointB.y = intersectionPointA.y;
                        }
                    }
                    else if (intersectionPointB !== null) {
                        this.globalTransformMatrix.transformPoint(intersectionPointB.x, intersectionPointB.y, intersectionPointB);
                    }
                }
                else {
                    if (intersectionPointA !== null) {
                        this.globalTransformMatrix.transformPoint(intersectionPointA.x, intersectionPointA.y, intersectionPointA);
                    }
                    if (intersectionPointB !== null) {
                        this.globalTransformMatrix.transformPoint(intersectionPointB.x, intersectionPointB.y, intersectionPointB);
                    }
                }
                if (normalRadians !== null) {
                    this.globalTransformMatrix.transformPoint(Math.cos(normalRadians.x), Math.sin(normalRadians.x), Slot._helpPoint, true);
                    normalRadians.x = Math.atan2(Slot._helpPoint.y, Slot._helpPoint.x);
                    this.globalTransformMatrix.transformPoint(Math.cos(normalRadians.y), Math.sin(normalRadians.y), Slot._helpPoint, true);
                    normalRadians.y = Math.atan2(Slot._helpPoint.y, Slot._helpPoint.x);
                }
            }
            return intersectionCount;
        }
        /**
         * - Forces the slot to update the state of the display object in the next frame.
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 强制插槽在下一帧更新显示对象的状态。
         * @version DragonBones 4.5
         * @language zh_CN
         */
        invalidUpdate() {
            this._displayDirty = true;
            this._transformDirty = true;
        }
        /**
         * - The visible of slot's display object.
         * @default true
         * @version DragonBones 5.6
         * @language en_US
         */
        /**
         * - 插槽的显示对象的可见。
         * @default true
         * @version DragonBones 5.6
         * @language zh_CN
         */
        get visible() {
            return this._visible;
        }
        set visible(value) {
            if (this._visible === value) {
                return;
            }
            this._visible = value;
            this._updateVisible();
        }
        /**
         * - The index of the display object displayed in the display list.
         * @example
         * <pre>
         *     let slot = armature.getSlot("weapon");
         *     slot.displayIndex = 3;
         *     slot.displayController = "none";
         * </pre>
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 此时显示的显示对象在显示列表中的索引。
         * @example
         * <pre>
         *     let slot = armature.getSlot("weapon");
         *     slot.displayIndex = 3;
         *     slot.displayController = "none";
         * </pre>
         * @version DragonBones 4.5
         * @language zh_CN
         */
        get displayIndex() {
            return this._displayIndex;
        }
        set displayIndex(value) {
            if (this._setDisplayIndex(value)) {
                this.update(-1);
            }
        }
        /**
         * - The slot name.
         * @see dragonBones.SlotData#name
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 插槽名称。
         * @see dragonBones.SlotData#name
         * @version DragonBones 3.0
         * @language zh_CN
         */
        get name() {
            return this._slotData.name;
        }
        /**
         * - Contains a display list of display objects or child armatures.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 包含显示对象或子骨架的显示列表。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        get displayList() {
            return this._displayList.concat();
        }
        set displayList(value) {
            const backupDisplayList = this._displayList.concat(); // Copy.
            const disposeDisplayList = new Array();
            if (this._setDisplayList(value)) {
                this.update(-1);
            }
            // Release replaced displays.
            for (const eachDisplay of backupDisplayList) {
                if (eachDisplay !== null && eachDisplay !== this._rawDisplay && eachDisplay !== this._meshDisplay &&
                    this._displayList.indexOf(eachDisplay) < 0 &&
                    disposeDisplayList.indexOf(eachDisplay) < 0) {
                    disposeDisplayList.push(eachDisplay);
                }
            }
            for (const eachDisplay of disposeDisplayList) {
                if (eachDisplay instanceof dragonBones.Armature) {
                    eachDisplay.dispose();
                }
                else {
                    this._disposeDisplay(eachDisplay, true);
                }
            }
        }
        /**
         * - The slot data.
         * @see dragonBones.SlotData
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 插槽数据。
         * @see dragonBones.SlotData
         * @version DragonBones 4.5
         * @language zh_CN
         */
        get slotData() {
            return this._slotData;
        }
        /**
         * @private
         */
        get rawDisplayDatas() {
            return this._rawDisplayDatas;
        }
        set rawDisplayDatas(value) {
            if (this._rawDisplayDatas === value) {
                return;
            }
            this._displayDirty = true;
            this._rawDisplayDatas = value;
            if (this._rawDisplayDatas !== null) {
                this._displayDatas.length = this._rawDisplayDatas.length;
                for (let i = 0, l = this._displayDatas.length; i < l; ++i) {
                    let rawDisplayData = this._rawDisplayDatas[i];
                    if (rawDisplayData === null) {
                        rawDisplayData = this._getDefaultRawDisplayData(i);
                    }
                    this._displayDatas[i] = rawDisplayData;
                }
            }
            else {
                this._displayDatas.length = 0;
            }
        }
        /**
         * - The custom bounding box data for the slot at current time.
         * @version DragonBones 5.0
         * @language en_US
         */
        /**
         * - 插槽此时的自定义包围盒数据。
         * @version DragonBones 5.0
         * @language zh_CN
         */
        get boundingBoxData() {
            return this._boundingBoxData;
        }
        /**
         * @private
         */
        get rawDisplay() {
            return this._rawDisplay;
        }
        /**
         * @private
         */
        get meshDisplay() {
            return this._meshDisplay;
        }
        /**
         * - The display object that the slot displays at this time.
         * @example
         * <pre>
         *     let slot = armature.getSlot("text");
         *     slot.display = new yourEngine.TextField();
         * </pre>
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 插槽此时显示的显示对象。
         * @example
         * <pre>
         *     let slot = armature.getSlot("text");
         *     slot.display = new yourEngine.TextField();
         * </pre>
         * @version DragonBones 3.0
         * @language zh_CN
         */
        get display() {
            return this._display;
        }
        set display(value) {
            if (this._display === value) {
                return;
            }
            const displayListLength = this._displayList.length;
            if (this._displayIndex < 0 && displayListLength === 0) { // Emprty.
                this._displayIndex = 0;
            }
            if (this._displayIndex < 0) {
                return;
            }
            else {
                const replaceDisplayList = this.displayList; // Copy.
                if (displayListLength <= this._displayIndex) {
                    replaceDisplayList.length = this._displayIndex + 1;
                }
                replaceDisplayList[this._displayIndex] = value;
                this.displayList = replaceDisplayList;
            }
        }
        /**
         * - The child armature that the slot displayed at current time.
         * @example
         * <pre>
         *     let slot = armature.getSlot("weapon");
         *     slot.childArmature = factory.buildArmature("weapon_blabla", "weapon_blabla_project");
         * </pre>
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 插槽此时显示的子骨架。
         * @example
         * <pre>
         *     let slot = armature.getSlot("weapon");
         *     slot.childArmature = factory.buildArmature("weapon_blabla", "weapon_blabla_project");
         * </pre>
         * @version DragonBones 3.0
         * @language zh_CN
         */
        get childArmature() {
            return this._childArmature;
        }
        set childArmature(value) {
            if (this._childArmature === value) {
                return;
            }
            this.display = value;
        }
        /**
         * - Deprecated, please refer to {@link #display}.
         * @deprecated
         * @language en_US
         */
        /**
         * - 已废弃，请参考 {@link #display}。
         * @deprecated
         * @language zh_CN
         */
        getDisplay() {
            return this.display;
        }
        /**
         * - Deprecated, please refer to {@link #display}.
         * @deprecated
         * @language en_US
         */
        /**
         * - 已废弃，请参考 {@link #display}。
         * @deprecated
         * @language zh_CN
         */
        setDisplay(value) {
            this.display = value;
        }
    }
    dragonBones.Slot = Slot;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * @internal
     * @private
     */
    class Constraint extends dragonBones.BaseObject {
        _onClear() {
            this._armature = null; //
            this._target = null; //
            this._root = null; //
            this._bone = null;
        }
        get name() {
            return this._constraintData.name;
        }
    }
    Constraint._helpMatrix = new dragonBones.Matrix();
    Constraint._helpTransform = new dragonBones.Transform();
    Constraint._helpPoint = new dragonBones.Point();
    dragonBones.Constraint = Constraint;
    /**
     * @internal
     * @private
     */
    class IKConstraint extends Constraint {
        static toString() {
            return "[class dragonBones.IKConstraint]";
        }
        _onClear() {
            super._onClear();
            this._scaleEnabled = false;
            this._bendPositive = false;
            this._weight = 1.0;
            this._constraintData = null;
        }
        _computeA() {
            const ikGlobal = this._target.global;
            const global = this._root.global;
            const globalTransformMatrix = this._root.globalTransformMatrix;
            let radian = Math.atan2(ikGlobal.y - global.y, ikGlobal.x - global.x);
            if (global.scaleX < 0.0) {
                radian += Math.PI;
            }
            global.rotation += (radian - global.rotation) * this._weight;
            global.toMatrix(globalTransformMatrix);
        }
        _computeB() {
            const boneLength = this._bone._boneData.length;
            const parent = this._root;
            const ikGlobal = this._target.global;
            const parentGlobal = parent.global;
            const global = this._bone.global;
            const globalTransformMatrix = this._bone.globalTransformMatrix;
            const x = globalTransformMatrix.a * boneLength;
            const y = globalTransformMatrix.b * boneLength;
            const lLL = x * x + y * y;
            const lL = Math.sqrt(lLL);
            let dX = global.x - parentGlobal.x;
            let dY = global.y - parentGlobal.y;
            const lPP = dX * dX + dY * dY;
            const lP = Math.sqrt(lPP);
            const rawRadian = global.rotation;
            const rawParentRadian = parentGlobal.rotation;
            const rawRadianA = Math.atan2(dY, dX);
            dX = ikGlobal.x - parentGlobal.x;
            dY = ikGlobal.y - parentGlobal.y;
            const lTT = dX * dX + dY * dY;
            const lT = Math.sqrt(lTT);
            let radianA = 0.0;
            if (lL + lP <= lT || lT + lL <= lP || lT + lP <= lL) {
                radianA = Math.atan2(ikGlobal.y - parentGlobal.y, ikGlobal.x - parentGlobal.x);
                if (lL + lP <= lT) {
                }
                else if (lP < lL) {
                    radianA += Math.PI;
                }
            }
            else {
                const h = (lPP - lLL + lTT) / (2.0 * lTT);
                const r = Math.sqrt(lPP - h * h * lTT) / lT;
                const hX = parentGlobal.x + (dX * h);
                const hY = parentGlobal.y + (dY * h);
                const rX = -dY * r;
                const rY = dX * r;
                let isPPR = false;
                if (parent._parent !== null) {
                    const parentParentMatrix = parent._parent.globalTransformMatrix;
                    isPPR = parentParentMatrix.a * parentParentMatrix.d - parentParentMatrix.b * parentParentMatrix.c < 0.0;
                }
                if (isPPR !== this._bendPositive) {
                    global.x = hX - rX;
                    global.y = hY - rY;
                }
                else {
                    global.x = hX + rX;
                    global.y = hY + rY;
                }
                radianA = Math.atan2(global.y - parentGlobal.y, global.x - parentGlobal.x);
            }
            const dR = dragonBones.Transform.normalizeRadian(radianA - rawRadianA);
            parentGlobal.rotation = rawParentRadian + dR * this._weight;
            parentGlobal.toMatrix(parent.globalTransformMatrix);
            //
            const currentRadianA = rawRadianA + dR * this._weight;
            global.x = parentGlobal.x + Math.cos(currentRadianA) * lP;
            global.y = parentGlobal.y + Math.sin(currentRadianA) * lP;
            //
            let radianB = Math.atan2(ikGlobal.y - global.y, ikGlobal.x - global.x);
            if (global.scaleX < 0.0) {
                radianB += Math.PI;
            }
            global.rotation = parentGlobal.rotation + rawRadian - rawParentRadian + dragonBones.Transform.normalizeRadian(radianB - dR - rawRadian) * this._weight;
            global.toMatrix(globalTransformMatrix);
        }
        init(constraintData, armature) {
            if (this._constraintData !== null) {
                return;
            }
            this._constraintData = constraintData;
            this._armature = armature;
            this._target = this._armature.getBone(this._constraintData.target.name);
            this._root = this._armature.getBone(this._constraintData.root.name);
            this._bone = this._constraintData.bone !== null ? this._armature.getBone(this._constraintData.bone.name) : null;
            {
                const ikConstraintData = this._constraintData;
                this._scaleEnabled = ikConstraintData.scaleEnabled;
                this._scaleEnabled = this._scaleEnabled; // TODO
                this._bendPositive = ikConstraintData.bendPositive;
                this._weight = ikConstraintData.weight;
            }
            this._root._hasConstraint = true;
        }
        update() {
            this._root.updateByConstraint();
            if (this._bone !== null) {
                this._bone.updateByConstraint();
                this._computeB();
            }
            else {
                this._computeA();
            }
        }
        invalidUpdate() {
            this._root.invalidUpdate();
            if (this._bone !== null) {
                this._bone.invalidUpdate();
            }
        }
    }
    dragonBones.IKConstraint = IKConstraint;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones_1) {
    /**
     * - Armature is the core of the skeleton animation system.
     * @see dragonBones.ArmatureData
     * @see dragonBones.Bone
     * @see dragonBones.Slot
     * @see dragonBones.Animation
     * @version DragonBones 3.0
     * @language en_US
     */
    /**
     * - 骨架是骨骼动画系统的核心。
     * @see dragonBones.ArmatureData
     * @see dragonBones.Bone
     * @see dragonBones.Slot
     * @see dragonBones.Animation
     * @version DragonBones 3.0
     * @language zh_CN
     */
    class Armature extends dragonBones_1.BaseObject {
        constructor() {
            super(...arguments);
            this._bones = [];
            this._slots = [];
            /**
             * @internal
             * @private
             */
            this._glueSlots = [];
            /**
             * @internal
             * @private
             */
            this._constraints = [];
            this._actions = [];
            this._animation = null; // Initial value.
            this._proxy = null; // Initial value.
            /**
             * @internal
             * @private
             */
            this._replaceTextureAtlasData = null; // Initial value.
            this._clock = null; // Initial value.
        }
        static toString() {
            return "[class dragonBones.Armature]";
        }
        static _onSortSlots(a, b) {
            return a._zOrder > b._zOrder ? 1 : -1;
        }
        /**
         * @private
         */
        _onClear() {
            if (this._clock !== null) { // Remove clock first.
                this._clock.remove(this);
            }
            for (const bone of this._bones) {
                bone.returnToPool();
            }
            for (const slot of this._slots) {
                slot.returnToPool();
            }
            for (const constraint of this._constraints) {
                constraint.returnToPool();
            }
            if (this._animation !== null) {
                this._animation.returnToPool();
            }
            if (this._proxy !== null) {
                this._proxy.dbClear();
            }
            if (this._replaceTextureAtlasData !== null) {
                this._replaceTextureAtlasData.returnToPool();
            }
            this.inheritAnimation = true;
            this.userData = null;
            this._lockUpdate = false;
            this._bonesDirty = false;
            this._slotsDirty = false;
            this._zOrderDirty = false;
            this._flipX = false;
            this._flipY = false;
            this._cacheFrameIndex = -1;
            this._bones.length = 0;
            this._slots.length = 0;
            this._glueSlots.length = 0;
            this._constraints.length = 0;
            this._actions.length = 0;
            this._armatureData = null; //
            this._animation = null; //
            this._proxy = null; //
            this._display = null;
            this._replaceTextureAtlasData = null;
            this._replacedTexture = null;
            this._dragonBones = null; //
            this._clock = null;
            this._parent = null;
        }
        _sortBones() {
            const total = this._bones.length;
            if (total <= 0) {
                return;
            }
            const sortHelper = this._bones.concat();
            let index = 0;
            let count = 0;
            this._bones.length = 0;
            while (count < total) {
                const bone = sortHelper[index++];
                if (index >= total) {
                    index = 0;
                }
                if (this._bones.indexOf(bone) >= 0) {
                    continue;
                }
                if (bone._hasConstraint) { // Wait constraint.
                    let flag = false;
                    for (const constraint of this._constraints) {
                        if (constraint._root === bone && this._bones.indexOf(constraint._target) < 0) {
                            flag = true;
                            break;
                        }
                    }
                    if (flag) {
                        continue;
                    }
                }
                if (bone.parent !== null && this._bones.indexOf(bone.parent) < 0) { // Wait parent.
                    continue;
                }
                this._bones.push(bone);
                count++;
            }
        }
        _sortSlots() {
            this._slots.sort(Armature._onSortSlots);
        }
        /**
         * @internal
         * @private
         */
        _sortZOrder(slotIndices, offset) {
            const slotDatas = this._armatureData.sortedSlots;
            const isOriginal = slotIndices === null;
            if (this._zOrderDirty || !isOriginal) {
                for (let i = 0, l = slotDatas.length; i < l; ++i) {
                    const slotIndex = isOriginal ? i : slotIndices[offset + i];
                    if (slotIndex < 0 || slotIndex >= l) {
                        continue;
                    }
                    const slotData = slotDatas[slotIndex];
                    const slot = this.getSlot(slotData.name);
                    if (slot !== null) {
                        slot._setZorder(i);
                    }
                }
                this._slotsDirty = true;
                this._zOrderDirty = !isOriginal;
            }
        }
        /**
         * @internal
         * @private
         */
        _addBoneToBoneList(value) {
            if (this._bones.indexOf(value) < 0) {
                this._bonesDirty = true;
                this._bones.push(value);
            }
        }
        /**
         * @internal
         * @private
         */
        _removeBoneFromBoneList(value) {
            const index = this._bones.indexOf(value);
            if (index >= 0) {
                this._bones.splice(index, 1);
            }
        }
        /**
         * @internal
         * @private
         */
        _addSlotToSlotList(value) {
            if (this._slots.indexOf(value) < 0) {
                this._slotsDirty = true;
                this._slots.push(value);
            }
        }
        /**
         * @internal
         * @private
         */
        _removeSlotFromSlotList(value) {
            const index = this._slots.indexOf(value);
            if (index >= 0) {
                this._slots.splice(index, 1);
            }
        }
        /**
         * @internal
         * @private
         */
        _bufferAction(action, append) {
            if (this._actions.indexOf(action) < 0) {
                if (append) {
                    this._actions.push(action);
                }
                else {
                    this._actions.unshift(action);
                }
            }
        }
        /**
         * - Dispose the armature. (Return to the object pool)
         * @example
         * <pre>
         *     removeChild(armature.display);
         *     armature.dispose();
         * </pre>
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 释放骨架。 （回收到对象池）
         * @example
         * <pre>
         *     removeChild(armature.display);
         *     armature.dispose();
         * </pre>
         * @version DragonBones 3.0
         * @language zh_CN
         */
        dispose() {
            if (this._armatureData !== null) {
                this._lockUpdate = true;
                this._dragonBones.bufferObject(this);
            }
        }
        /**
         * @internal
         * @private
         */
        init(armatureData, proxy, display, dragonBones) {
            if (this._armatureData !== null) {
                return;
            }
            this._armatureData = armatureData;
            this._animation = dragonBones_1.BaseObject.borrowObject(dragonBones_1.Animation);
            this._proxy = proxy;
            this._display = display;
            this._dragonBones = dragonBones;
            this._proxy.dbInit(this);
            this._animation.init(this);
            this._animation.animations = this._armatureData.animations;
        }
        /**
         * @inheritDoc
         */
        advanceTime(passedTime) {
            if (this._lockUpdate) {
                return;
            }
            if (this._armatureData === null) {
                console.warn("The armature has been disposed.");
                return;
            }
            else if (this._armatureData.parent === null) {
                console.warn("The armature data has been disposed.\nPlease make sure dispose armature before call factory.clear().");
                return;
            }
            const prevCacheFrameIndex = this._cacheFrameIndex;
            // Update animation.
            this._animation.advanceTime(passedTime);
            // Sort bones and slots.
            if (this._bonesDirty) {
                this._bonesDirty = false;
                this._sortBones();
            }
            if (this._slotsDirty) {
                this._slotsDirty = false;
                this._sortSlots();
            }
            // Update bones and slots.
            if (this._cacheFrameIndex < 0 || this._cacheFrameIndex !== prevCacheFrameIndex) {
                let i = 0, l = 0;
                for (i = 0, l = this._bones.length; i < l; ++i) {
                    this._bones[i].update(this._cacheFrameIndex);
                }
                for (i = 0, l = this._slots.length; i < l; ++i) {
                    this._slots[i].update(this._cacheFrameIndex);
                }
                for (i = 0, l = this._glueSlots.length; i < l; ++i) {
                    this._glueSlots[i]._updateGlueMesh();
                }
            }
            // Do actions.
            if (this._actions.length > 0) {
                this._lockUpdate = true;
                for (const action of this._actions) {
                    if (action.type === 0 /* ActionType.Play */) {
                        this._animation.fadeIn(action.name);
                    }
                }
                this._actions.length = 0;
                this._lockUpdate = false;
            }
            this._proxy.dbUpdate();
        }
        /**
         * - Forces a specific bone or its owning slot to update the transform or display property in the next frame.
         * @param boneName - The bone name. (If not set, all bones will be update)
         * @param updateSlot - Whether to update the bone's slots. (Default: false)
         * @see dragonBones.Bone#invalidUpdate()
         * @see dragonBones.Slot#invalidUpdate()
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 强制特定骨骼或其拥有的插槽在下一帧更新变换或显示属性。
         * @param boneName - 骨骼名称。 （如果未设置，将更新所有骨骼）
         * @param updateSlot - 是否更新骨骼的插槽。 （默认: false）
         * @see dragonBones.Bone#invalidUpdate()
         * @see dragonBones.Slot#invalidUpdate()
         * @version DragonBones 3.0
         * @language zh_CN
         */
        invalidUpdate(boneName = null, updateSlot = false) {
            if (boneName !== null && boneName.length > 0) {
                const bone = this.getBone(boneName);
                if (bone !== null) {
                    bone.invalidUpdate();
                    if (updateSlot) {
                        for (const slot of this._slots) {
                            if (slot.parent === bone) {
                                slot.invalidUpdate();
                            }
                        }
                    }
                }
            }
            else {
                for (const bone of this._bones) {
                    bone.invalidUpdate();
                }
                if (updateSlot) {
                    for (const slot of this._slots) {
                        slot.invalidUpdate();
                    }
                }
            }
        }
        /**
         * - Check whether a specific point is inside a custom bounding box in a slot.
         * The coordinate system of the point is the inner coordinate system of the armature.
         * Custom bounding boxes need to be customized in Dragonbones Pro.
         * @param x - The horizontal coordinate of the point.
         * @param y - The vertical coordinate of the point.
         * @version DragonBones 5.0
         * @language en_US
         */
        /**
         * - 检查特定点是否在某个插槽的自定义边界框内。
         * 点的坐标系为骨架内坐标系。
         * 自定义边界框需要在 DragonBones Pro 中自定义。
         * @param x - 点的水平坐标。
         * @param y - 点的垂直坐标。
         * @version DragonBones 5.0
         * @language zh_CN
         */
        containsPoint(x, y) {
            for (const slot of this._slots) {
                if (slot.containsPoint(x, y)) {
                    return slot;
                }
            }
            return null;
        }
        /**
         * - Check whether a specific segment intersects a custom bounding box for a slot in the armature.
         * The coordinate system of the segment and intersection is the inner coordinate system of the armature.
         * Custom bounding boxes need to be customized in Dragonbones Pro.
         * @param xA - The horizontal coordinate of the beginning of the segment.
         * @param yA - The vertical coordinate of the beginning of the segment.
         * @param xB - The horizontal coordinate of the end point of the segment.
         * @param yB - The vertical coordinate of the end point of the segment.
         * @param intersectionPointA - The first intersection at which a line segment intersects the bounding box from the beginning to the end. (If not set, the intersection point will not calculated)
         * @param intersectionPointB - The first intersection at which a line segment intersects the bounding box from the end to the beginning. (If not set, the intersection point will not calculated)
         * @param normalRadians - The normal radians of the tangent of the intersection boundary box. [x: Normal radian of the first intersection tangent, y: Normal radian of the second intersection tangent] (If not set, the normal will not calculated)
         * @returns The slot of the first custom bounding box where the segment intersects from the start point to the end point.
         * @version DragonBones 5.0
         * @language en_US
         */
        /**
         * - 检查特定线段是否与骨架的某个插槽的自定义边界框相交。
         * 线段和交点的坐标系均为骨架内坐标系。
         * 自定义边界框需要在 DragonBones Pro 中自定义。
         * @param xA - 线段起点的水平坐标。
         * @param yA - 线段起点的垂直坐标。
         * @param xB - 线段终点的水平坐标。
         * @param yB - 线段终点的垂直坐标。
         * @param intersectionPointA - 线段从起点到终点与边界框相交的第一个交点。 （如果未设置，则不计算交点）
         * @param intersectionPointB - 线段从终点到起点与边界框相交的第一个交点。 （如果未设置，则不计算交点）
         * @param normalRadians - 交点边界框切线的法线弧度。 [x: 第一个交点切线的法线弧度, y: 第二个交点切线的法线弧度] （如果未设置，则不计算法线）
         * @returns 线段从起点到终点相交的第一个自定义边界框的插槽。
         * @version DragonBones 5.0
         * @language zh_CN
         */
        intersectsSegment(xA, yA, xB, yB, intersectionPointA = null, intersectionPointB = null, normalRadians = null) {
            const isV = xA === xB;
            let dMin = 0.0;
            let dMax = 0.0;
            let intXA = 0.0;
            let intYA = 0.0;
            let intXB = 0.0;
            let intYB = 0.0;
            let intAN = 0.0;
            let intBN = 0.0;
            let intSlotA = null;
            let intSlotB = null;
            for (const slot of this._slots) {
                const intersectionCount = slot.intersectsSegment(xA, yA, xB, yB, intersectionPointA, intersectionPointB, normalRadians);
                if (intersectionCount > 0) {
                    if (intersectionPointA !== null || intersectionPointB !== null) {
                        if (intersectionPointA !== null) {
                            let d = isV ? intersectionPointA.y - yA : intersectionPointA.x - xA;
                            if (d < 0.0) {
                                d = -d;
                            }
                            if (intSlotA === null || d < dMin) {
                                dMin = d;
                                intXA = intersectionPointA.x;
                                intYA = intersectionPointA.y;
                                intSlotA = slot;
                                if (normalRadians) {
                                    intAN = normalRadians.x;
                                }
                            }
                        }
                        if (intersectionPointB !== null) {
                            let d = intersectionPointB.x - xA;
                            if (d < 0.0) {
                                d = -d;
                            }
                            if (intSlotB === null || d > dMax) {
                                dMax = d;
                                intXB = intersectionPointB.x;
                                intYB = intersectionPointB.y;
                                intSlotB = slot;
                                if (normalRadians !== null) {
                                    intBN = normalRadians.y;
                                }
                            }
                        }
                    }
                    else {
                        intSlotA = slot;
                        break;
                    }
                }
            }
            if (intSlotA !== null && intersectionPointA !== null) {
                intersectionPointA.x = intXA;
                intersectionPointA.y = intYA;
                if (normalRadians !== null) {
                    normalRadians.x = intAN;
                }
            }
            if (intSlotB !== null && intersectionPointB !== null) {
                intersectionPointB.x = intXB;
                intersectionPointB.y = intYB;
                if (normalRadians !== null) {
                    normalRadians.y = intBN;
                }
            }
            return intSlotA;
        }
        /**
         * - Get a specific bone.
         * @param name - The bone name.
         * @see dragonBones.Bone
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 获取特定的骨骼。
         * @param name - 骨骼名称。
         * @see dragonBones.Bone
         * @version DragonBones 3.0
         * @language zh_CN
         */
        getBone(name) {
            for (const bone of this._bones) {
                if (bone.name === name) {
                    return bone;
                }
            }
            return null;
        }
        /**
         * - Get a specific bone by the display.
         * @param display - The display object.
         * @see dragonBones.Bone
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 通过显示对象获取特定的骨骼。
         * @param display - 显示对象。
         * @see dragonBones.Bone
         * @version DragonBones 3.0
         * @language zh_CN
         */
        getBoneByDisplay(display) {
            const slot = this.getSlotByDisplay(display);
            return slot !== null ? slot.parent : null;
        }
        /**
         * - Get a specific slot.
         * @param name - The slot name.
         * @see dragonBones.Slot
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 获取特定的插槽。
         * @param name - 插槽名称。
         * @see dragonBones.Slot
         * @version DragonBones 3.0
         * @language zh_CN
         */
        getSlot(name) {
            for (const slot of this._slots) {
                if (slot.name === name) {
                    return slot;
                }
            }
            return null;
        }
        /**
         * - Get a specific slot by the display.
         * @param display - The display object.
         * @see dragonBones.Slot
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 通过显示对象获取特定的插槽。
         * @param display - 显示对象。
         * @see dragonBones.Slot
         * @version DragonBones 3.0
         * @language zh_CN
         */
        getSlotByDisplay(display) {
            if (display !== null) {
                for (const slot of this._slots) {
                    if (slot.display === display) {
                        return slot;
                    }
                }
            }
            return null;
        }
        /**
         * @deprecated
         */
        addBone(value, parentName) {
            console.assert(value !== null);
            value._setArmature(this);
            value._setParent(parentName.length > 0 ? this.getBone(parentName) : null);
        }
        /**
         * @deprecated
         */
        addSlot(value, parentName) {
            const bone = this.getBone(parentName);
            console.assert(value !== null && bone !== null);
            value._setArmature(this);
            value._setParent(bone);
        }
        /**
         * @private
         */
        addConstraint(value) {
            if (this._constraints.indexOf(value) < 0) {
                this._constraints.push(value);
            }
        }
        /**
         * @deprecated
         */
        removeBone(value) {
            console.assert(value !== null && value.armature === this);
            value._setParent(null);
            value._setArmature(null);
        }
        /**
         * @deprecated
         */
        removeSlot(value) {
            console.assert(value !== null && value.armature === this);
            value._setParent(null);
            value._setArmature(null);
        }
        /**
         * - Get all bones.
         * @see dragonBones.Bone
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 获取所有的骨骼。
         * @see dragonBones.Bone
         * @version DragonBones 3.0
         * @language zh_CN
         */
        getBones() {
            return this._bones;
        }
        /**
         * - Get all slots.
         * @see dragonBones.Slot
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 获取所有的插槽。
         * @see dragonBones.Slot
         * @version DragonBones 3.0
         * @language zh_CN
         */
        getSlots() {
            return this._slots;
        }
        /**
         * - Whether to flip the armature horizontally.
         * @version DragonBones 5.5
         * @language en_US
         */
        /**
         * - 是否将骨架水平翻转。
         * @version DragonBones 5.5
         * @language zh_CN
         */
        get flipX() {
            return this._flipX;
        }
        set flipX(value) {
            if (this._flipX === value) {
                return;
            }
            this._flipX = value;
            this.invalidUpdate();
        }
        /**
         * - Whether to flip the armature vertically.
         * @version DragonBones 5.5
         * @language en_US
         */
        /**
         * - 是否将骨架垂直翻转。
         * @version DragonBones 5.5
         * @language zh_CN
         */
        get flipY() {
            return this._flipY;
        }
        set flipY(value) {
            if (this._flipY === value) {
                return;
            }
            this._flipY = value;
            this.invalidUpdate();
        }
        /**
         * - The animation cache frame rate, which turns on the animation cache when the set value is greater than 0.
         * There is a certain amount of memory overhead to improve performance by caching animation data in memory.
         * The frame rate should not be set too high, usually with the frame rate of the animation is similar and lower than the program running frame rate.
         * When the animation cache is turned on, some features will fail, such as the offset property of bone.
         * @example
         * <pre>
         *     armature.cacheFrameRate = 24;
         * </pre>
         * @see dragonBones.DragonBonesData#frameRate
         * @see dragonBones.ArmatureData#frameRate
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 动画缓存帧率，当设置的值大于 0 的时，将会开启动画缓存。
         * 通过将动画数据缓存在内存中来提高运行性能，会有一定的内存开销。
         * 帧率不宜设置的过高，通常跟动画的帧率相当且低于程序运行的帧率。
         * 开启动画缓存后，某些功能将会失效，比如骨骼的 offset 属性等。
         * @example
         * <pre>
         *     armature.cacheFrameRate = 24;
         * </pre>
         * @see dragonBones.DragonBonesData#frameRate
         * @see dragonBones.ArmatureData#frameRate
         * @version DragonBones 4.5
         * @language zh_CN
         */
        get cacheFrameRate() {
            return this._armatureData.cacheFrameRate;
        }
        set cacheFrameRate(value) {
            if (this._armatureData.cacheFrameRate !== value) {
                this._armatureData.cacheFrames(value);
                // Set child armature frameRate.
                for (const slot of this._slots) {
                    const childArmature = slot.childArmature;
                    if (childArmature !== null) {
                        childArmature.cacheFrameRate = value;
                    }
                }
            }
        }
        /**
         * - The armature name.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 骨架名称。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        get name() {
            return this._armatureData.name;
        }
        /**
         * - The armature data.
         * @see dragonBones.ArmatureData
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 骨架数据。
         * @see dragonBones.ArmatureData
         * @version DragonBones 4.5
         * @language zh_CN
         */
        get armatureData() {
            return this._armatureData;
        }
        /**
         * - The animation player.
         * @see dragonBones.Animation
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 动画播放器。
         * @see dragonBones.Animation
         * @version DragonBones 3.0
         * @language zh_CN
         */
        get animation() {
            return this._animation;
        }
        /**
         * @pivate
         */
        get proxy() {
            return this._proxy;
        }
        /**
         * - The EventDispatcher instance of the armature.
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 该骨架的 EventDispatcher 实例。
         * @version DragonBones 4.5
         * @language zh_CN
         */
        get eventDispatcher() {
            return this._proxy;
        }
        /**
         * - The display container.
         * The display of the slot is displayed as the parent.
         * Depending on the rendering engine, the type will be different, usually the DisplayObjectContainer type.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 显示容器实例。
         * 插槽的显示对象都会以此显示容器为父级。
         * 根据渲染引擎的不同，类型会不同，通常是 DisplayObjectContainer 类型。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        get display() {
            return this._display;
        }
        /**
         * @private
         */
        get replacedTexture() {
            return this._replacedTexture;
        }
        set replacedTexture(value) {
            if (this._replacedTexture === value) {
                return;
            }
            if (this._replaceTextureAtlasData !== null) {
                this._replaceTextureAtlasData.returnToPool();
                this._replaceTextureAtlasData = null;
            }
            this._replacedTexture = value;
            for (const slot of this._slots) {
                slot.invalidUpdate();
                slot.update(-1);
            }
        }
        /**
         * @inheritDoc
         */
        get clock() {
            return this._clock;
        }
        set clock(value) {
            if (this._clock === value) {
                return;
            }
            if (this._clock !== null) {
                this._clock.remove(this);
            }
            this._clock = value;
            if (this._clock) {
                this._clock.add(this);
            }
            // Update childArmature clock.
            for (const slot of this._slots) {
                const childArmature = slot.childArmature;
                if (childArmature !== null) {
                    childArmature.clock = this._clock;
                }
            }
        }
        /**
         * - Get the parent slot which the armature belongs to.
         * @see dragonBones.Slot
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 该骨架所属的父插槽。
         * @see dragonBones.Slot
         * @version DragonBones 4.5
         * @language zh_CN
         */
        get parent() {
            return this._parent;
        }
        /**
         * @deprecated
         * @private
         */
        replaceTexture(texture) {
            this.replacedTexture = texture;
        }
        /**
         * - Deprecated, please refer to {@link #eventDispatcher}.
         * @deprecated
         * @language en_US
         */
        /**
         * - 已废弃，请参考 {@link #eventDispatcher}。
         * @deprecated
         * @language zh_CN
         */
        hasEventListener(type) {
            return this._proxy.hasDBEventListener(type);
        }
        /**
         * - Deprecated, please refer to {@link #eventDispatcher}.
         * @deprecated
         * @language en_US
         */
        /**
         * - 已废弃，请参考 {@link #eventDispatcher}。
         * @deprecated
         * @language zh_CN
         */
        addEventListener(type, listener, target) {
            this._proxy.addDBEventListener(type, listener, target);
        }
        /**
         * - Deprecated, please refer to {@link #eventDispatcher}.
         * @deprecated
         * @language en_US
         */
        /**
         * - 已废弃，请参考 {@link #eventDispatcher}。
         * @deprecated
         * @language zh_CN
         */
        removeEventListener(type, listener, target) {
            this._proxy.removeDBEventListener(type, listener, target);
        }
        /**
         * - Deprecated, please refer to {@link #cacheFrameRate}.
         * @deprecated
         * @language en_US
         */
        /**
         * - 已废弃，请参考 {@link #cacheFrameRate}。
         * @deprecated
         * @language zh_CN
         */
        enableAnimationCache(frameRate) {
            this.cacheFrameRate = frameRate;
        }
        /**
         * - Deprecated, please refer to {@link #display}.
         * @deprecated
         * @language en_US
         */
        /**
         * - 已废弃，请参考 {@link #display}。
         * @deprecated
         * @language zh_CN
         */
        getDisplay() {
            return this._display;
        }
    }
    dragonBones_1.Armature = Armature;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * @internal
     * @private
     */
    class TimelineState extends dragonBones.BaseObject {
        _onClear() {
            this.playState = -1;
            this.currentPlayTimes = -1;
            this.currentTime = -1.0;
            this._tweenState = 0 /* TweenState.None */;
            this._frameRate = 0;
            this._frameValueOffset = 0;
            this._frameCount = 0;
            this._frameOffset = 0;
            this._frameIndex = -1;
            this._frameRateR = 0.0;
            this._position = 0.0;
            this._duration = 0.0;
            this._timeScale = 1.0;
            this._timeOffset = 0.0;
            this._dragonBonesData = null; //
            this._animationData = null; //
            this._timelineData = null; //
            this._armature = null; //
            this._animationState = null; //
            this._actionTimeline = null; //
            this._frameArray = null; //
            this._frameIntArray = null; //
            this._frameFloatArray = null; //
            this._timelineArray = null; //
            this._frameIndices = null; //
        }
        _setCurrentTime(passedTime) {
            const prevState = this.playState;
            const prevPlayTimes = this.currentPlayTimes;
            const prevTime = this.currentTime;
            if (this._actionTimeline !== null && this._frameCount <= 1) { // No frame or only one frame.
                this.playState = this._actionTimeline.playState >= 0 ? 1 : -1;
                this.currentPlayTimes = 1;
                this.currentTime = this._actionTimeline.currentTime;
            }
            else if (this._actionTimeline === null || this._timeScale !== 1.0 || this._timeOffset !== 0.0) { // Action timeline or has scale and offset.
                const playTimes = this._animationState.playTimes;
                const totalTime = playTimes * this._duration;
                passedTime *= this._timeScale;
                if (this._timeOffset !== 0.0) {
                    passedTime += this._timeOffset * this._animationData.duration;
                }
                if (playTimes > 0 && (passedTime >= totalTime || passedTime <= -totalTime)) {
                    if (this.playState <= 0 && this._animationState._playheadState === 3) {
                        this.playState = 1;
                    }
                    this.currentPlayTimes = playTimes;
                    if (passedTime < 0.0) {
                        this.currentTime = 0.0;
                    }
                    else {
                        this.currentTime = this._duration + 0.000001; // Precision problem
                    }
                }
                else {
                    if (this.playState !== 0 && this._animationState._playheadState === 3) {
                        this.playState = 0;
                    }
                    if (passedTime < 0.0) {
                        passedTime = -passedTime;
                        this.currentPlayTimes = Math.floor(passedTime / this._duration);
                        this.currentTime = this._duration - (passedTime % this._duration);
                    }
                    else {
                        this.currentPlayTimes = Math.floor(passedTime / this._duration);
                        this.currentTime = passedTime % this._duration;
                    }
                }
                this.currentTime += this._position;
            }
            else { // Multi frames.
                this.playState = this._actionTimeline.playState;
                this.currentPlayTimes = this._actionTimeline.currentPlayTimes;
                this.currentTime = this._actionTimeline.currentTime;
            }
            if (this.currentPlayTimes === prevPlayTimes && this.currentTime === prevTime) {
                return false;
            }
            // Clear frame flag when timeline start or loopComplete.
            if ((prevState < 0 && this.playState !== prevState) ||
                (this.playState <= 0 && this.currentPlayTimes !== prevPlayTimes)) {
                this._frameIndex = -1;
            }
            return true;
        }
        init(armature, animationState, timelineData) {
            this._armature = armature;
            this._animationState = animationState;
            this._timelineData = timelineData;
            this._actionTimeline = this._animationState._actionTimeline;
            if (this === this._actionTimeline) {
                this._actionTimeline = null; //
            }
            this._animationData = this._animationState._animationData;
            this._frameRate = this._animationData.parent.frameRate;
            this._frameRateR = 1.0 / this._frameRate;
            this._position = this._animationState._position;
            this._duration = this._animationState._duration;
            this._dragonBonesData = this._animationData.parent.parent; // May by the animation data is not belone to this armature data.
            if (this._timelineData !== null) {
                this._frameIntArray = this._dragonBonesData.frameIntArray;
                this._frameFloatArray = this._dragonBonesData.frameFloatArray;
                this._frameArray = this._dragonBonesData.frameArray;
                this._timelineArray = this._dragonBonesData.timelineArray;
                this._frameIndices = this._dragonBonesData.frameIndices;
                this._frameCount = this._timelineArray[this._timelineData.offset + 2 /* BinaryOffset.TimelineKeyFrameCount */];
                this._frameValueOffset = this._timelineArray[this._timelineData.offset + 4 /* BinaryOffset.TimelineFrameValueOffset */];
                this._timeScale = 100.0 / this._timelineArray[this._timelineData.offset + 0 /* BinaryOffset.TimelineScale */];
                this._timeOffset = this._timelineArray[this._timelineData.offset + 1 /* BinaryOffset.TimelineOffset */] * 0.01;
            }
        }
        fadeOut() { }
        update(passedTime) {
            if (this._setCurrentTime(passedTime)) {
                if (this._frameCount > 1) {
                    const timelineFrameIndex = Math.floor(this.currentTime * this._frameRate); // uint
                    const frameIndex = this._frameIndices[this._timelineData.frameIndicesOffset + timelineFrameIndex];
                    if (this._frameIndex !== frameIndex) {
                        this._frameIndex = frameIndex;
                        this._frameOffset = this._animationData.frameOffset + this._timelineArray[this._timelineData.offset + 5 /* BinaryOffset.TimelineFrameOffset */ + this._frameIndex];
                        this._onArriveAtFrame();
                    }
                }
                else if (this._frameIndex < 0) {
                    this._frameIndex = 0;
                    if (this._timelineData !== null) { // May be pose timeline.
                        this._frameOffset = this._animationData.frameOffset + this._timelineArray[this._timelineData.offset + 5 /* BinaryOffset.TimelineFrameOffset */];
                    }
                    this._onArriveAtFrame();
                }
                if (this._tweenState !== 0 /* TweenState.None */) {
                    this._onUpdateFrame();
                }
            }
        }
    }
    dragonBones.TimelineState = TimelineState;
    /**
     * @internal
     * @private
     */
    class TweenTimelineState extends TimelineState {
        static _getEasingValue(tweenType, progress, easing) {
            let value = progress;
            switch (tweenType) {
                case 3 /* TweenType.QuadIn */:
                    value = Math.pow(progress, 2.0);
                    break;
                case 4 /* TweenType.QuadOut */:
                    value = 1.0 - Math.pow(1.0 - progress, 2.0);
                    break;
                case 5 /* TweenType.QuadInOut */:
                    value = 0.5 * (1.0 - Math.cos(progress * Math.PI));
                    break;
            }
            return (value - progress) * easing + progress;
        }
        static _getEasingCurveValue(progress, samples, count, offset) {
            if (progress <= 0.0) {
                return 0.0;
            }
            else if (progress >= 1.0) {
                return 1.0;
            }
            const segmentCount = count + 1; // + 2 - 1
            const valueIndex = Math.floor(progress * segmentCount);
            const fromValue = valueIndex === 0 ? 0.0 : samples[offset + valueIndex - 1];
            const toValue = (valueIndex === segmentCount - 1) ? 10000.0 : samples[offset + valueIndex];
            return (fromValue + (toValue - fromValue) * (progress * segmentCount - valueIndex)) * 0.0001;
        }
        _onClear() {
            super._onClear();
            this._tweenType = 0 /* TweenType.None */;
            this._curveCount = 0;
            this._framePosition = 0.0;
            this._frameDurationR = 0.0;
            this._tweenProgress = 0.0;
            this._tweenEasing = 0.0;
        }
        _onArriveAtFrame() {
            if (this._frameCount > 1 &&
                (this._frameIndex !== this._frameCount - 1 ||
                    this._animationState.playTimes === 0 ||
                    this._animationState.currentPlayTimes < this._animationState.playTimes - 1)) {
                this._tweenType = this._frameArray[this._frameOffset + 1 /* BinaryOffset.FrameTweenType */]; // TODO recode ture tween type.
                this._tweenState = this._tweenType === 0 /* TweenType.None */ ? 1 /* TweenState.Once */ : 2 /* TweenState.Always */;
                if (this._tweenType === 2 /* TweenType.Curve */) {
                    this._curveCount = this._frameArray[this._frameOffset + 2 /* BinaryOffset.FrameTweenEasingOrCurveSampleCount */];
                }
                else if (this._tweenType !== 0 /* TweenType.None */ && this._tweenType !== 1 /* TweenType.Line */) {
                    this._tweenEasing = this._frameArray[this._frameOffset + 2 /* BinaryOffset.FrameTweenEasingOrCurveSampleCount */] * 0.01;
                }
                this._framePosition = this._frameArray[this._frameOffset] * this._frameRateR;
                if (this._frameIndex === this._frameCount - 1) {
                    this._frameDurationR = 1.0 / (this._animationData.duration - this._framePosition);
                }
                else {
                    const nextFrameOffset = this._animationData.frameOffset + this._timelineArray[this._timelineData.offset + 5 /* BinaryOffset.TimelineFrameOffset */ + this._frameIndex + 1];
                    const frameDuration = this._frameArray[nextFrameOffset] * this._frameRateR - this._framePosition;
                    if (frameDuration > 0) {
                        this._frameDurationR = 1.0 / frameDuration;
                    }
                    else {
                        this._frameDurationR = 0.0;
                    }
                }
            }
            else {
                this._tweenState = 1 /* TweenState.Once */;
            }
        }
        _onUpdateFrame() {
            if (this._tweenState === 2 /* TweenState.Always */) {
                this._tweenProgress = (this.currentTime - this._framePosition) * this._frameDurationR;
                if (this._tweenType === 2 /* TweenType.Curve */) {
                    this._tweenProgress = TweenTimelineState._getEasingCurveValue(this._tweenProgress, this._frameArray, this._curveCount, this._frameOffset + 3 /* BinaryOffset.FrameCurveSamples */);
                }
                else if (this._tweenType !== 1 /* TweenType.Line */) {
                    this._tweenProgress = TweenTimelineState._getEasingValue(this._tweenType, this._tweenProgress, this._tweenEasing);
                }
            }
            else {
                this._tweenProgress = 0.0;
            }
        }
    }
    dragonBones.TweenTimelineState = TweenTimelineState;
    /**
     * @internal
     * @private
     */
    class BoneTimelineState extends TweenTimelineState {
        _onClear() {
            super._onClear();
            this.bone = null; //
            this.bonePose = null; //
        }
        blend(state) {
            const blendWeight = this.bone._blendState.blendWeight;
            const animationPose = this.bone.animationPose;
            const result = this.bonePose.result;
            if (state === 2) {
                animationPose.x += result.x * blendWeight;
                animationPose.y += result.y * blendWeight;
                animationPose.rotation += result.rotation * blendWeight;
                animationPose.skew += result.skew * blendWeight;
                animationPose.scaleX += (result.scaleX - 1.0) * blendWeight;
                animationPose.scaleY += (result.scaleY - 1.0) * blendWeight;
            }
            else if (blendWeight !== 1.0) {
                animationPose.x = result.x * blendWeight;
                animationPose.y = result.y * blendWeight;
                animationPose.rotation = result.rotation * blendWeight;
                animationPose.skew = result.skew * blendWeight;
                animationPose.scaleX = (result.scaleX - 1.0) * blendWeight + 1.0;
                animationPose.scaleY = (result.scaleY - 1.0) * blendWeight + 1.0;
            }
            else {
                animationPose.x = result.x;
                animationPose.y = result.y;
                animationPose.rotation = result.rotation;
                animationPose.skew = result.skew;
                animationPose.scaleX = result.scaleX;
                animationPose.scaleY = result.scaleY;
            }
            if (this._animationState._fadeState !== 0 || this._animationState._subFadeState !== 0) {
                this.bone._transformDirty = true;
            }
        }
    }
    dragonBones.BoneTimelineState = BoneTimelineState;
    /**
     * @internal
     * @private
     */
    class SlotTimelineState extends TweenTimelineState {
        _onClear() {
            super._onClear();
            this.slot = null; //
        }
    }
    dragonBones.SlotTimelineState = SlotTimelineState;
    /**
     * @internal
     * @private
     */
    class ConstraintTimelineState extends TweenTimelineState {
        _onClear() {
            super._onClear();
            this.constraint = null; //
        }
    }
    dragonBones.ConstraintTimelineState = ConstraintTimelineState;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * @internal
     * @private
     */
    class ActionTimelineState extends dragonBones.TimelineState {
        static toString() {
            return "[class dragonBones.ActionTimelineState]";
        }
        _onCrossFrame(frameIndex) {
            const eventDispatcher = this._armature.eventDispatcher;
            if (this._animationState.actionEnabled) {
                const frameOffset = this._animationData.frameOffset + this._timelineArray[this._timelineData.offset + 5 /* BinaryOffset.TimelineFrameOffset */ + frameIndex];
                const actionCount = this._frameArray[frameOffset + 1];
                const actions = this._animationData.parent.actions; // May be the animaton data not belong to this armature data.
                for (let i = 0; i < actionCount; ++i) {
                    const actionIndex = this._frameArray[frameOffset + 2 + i];
                    const action = actions[actionIndex];
                    if (action.type === 0 /* ActionType.Play */) {
                        if (action.slot !== null) {
                            const slot = this._armature.getSlot(action.slot.name);
                            if (slot !== null) {
                                const childArmature = slot.childArmature;
                                if (childArmature !== null) {
                                    childArmature._bufferAction(action, true);
                                }
                            }
                        }
                        else if (action.bone !== null) {
                            for (const slot of this._armature.getSlots()) {
                                const childArmature = slot.childArmature;
                                if (childArmature !== null && slot.parent._boneData === action.bone) {
                                    childArmature._bufferAction(action, true);
                                }
                            }
                        }
                        else {
                            this._armature._bufferAction(action, true);
                        }
                    }
                    else {
                        const eventType = action.type === 10 /* ActionType.Frame */ ? dragonBones.EventObject.FRAME_EVENT : dragonBones.EventObject.SOUND_EVENT;
                        if (action.type === 11 /* ActionType.Sound */ || eventDispatcher.hasDBEventListener(eventType)) {
                            const eventObject = dragonBones.BaseObject.borrowObject(dragonBones.EventObject);
                            // eventObject.time = this._frameArray[frameOffset] * this._frameRateR; // Precision problem
                            eventObject.time = this._frameArray[frameOffset] / this._frameRate;
                            eventObject.type = eventType;
                            eventObject.name = action.name;
                            eventObject.data = action.data;
                            eventObject.armature = this._armature;
                            eventObject.animationState = this._animationState;
                            if (action.bone !== null) {
                                eventObject.bone = this._armature.getBone(action.bone.name);
                            }
                            if (action.slot !== null) {
                                eventObject.slot = this._armature.getSlot(action.slot.name);
                            }
                            this._armature._dragonBones.bufferEvent(eventObject);
                        }
                    }
                }
            }
        }
        _onArriveAtFrame() { }
        _onUpdateFrame() { }
        update(passedTime) {
            const prevState = this.playState;
            let prevPlayTimes = this.currentPlayTimes;
            let prevTime = this.currentTime;
            if (this._setCurrentTime(passedTime)) {
                const eventDispatcher = this._armature.eventDispatcher;
                if (prevState < 0) {
                    if (this.playState !== prevState) {
                        if (this._animationState.displayControl && this._animationState.resetToPose) { // Reset zorder to pose.
                            this._armature._sortZOrder(null, 0);
                        }
                        prevPlayTimes = this.currentPlayTimes;
                        if (eventDispatcher.hasDBEventListener(dragonBones.EventObject.START)) {
                            const eventObject = dragonBones.BaseObject.borrowObject(dragonBones.EventObject);
                            eventObject.type = dragonBones.EventObject.START;
                            eventObject.armature = this._armature;
                            eventObject.animationState = this._animationState;
                            this._armature._dragonBones.bufferEvent(eventObject);
                        }
                    }
                    else {
                        return;
                    }
                }
                const isReverse = this._animationState.timeScale < 0.0;
                let loopCompleteEvent = null;
                let completeEvent = null;
                if (this.currentPlayTimes !== prevPlayTimes) {
                    if (eventDispatcher.hasDBEventListener(dragonBones.EventObject.LOOP_COMPLETE)) {
                        loopCompleteEvent = dragonBones.BaseObject.borrowObject(dragonBones.EventObject);
                        loopCompleteEvent.type = dragonBones.EventObject.LOOP_COMPLETE;
                        loopCompleteEvent.armature = this._armature;
                        loopCompleteEvent.animationState = this._animationState;
                    }
                    if (this.playState > 0) {
                        if (eventDispatcher.hasDBEventListener(dragonBones.EventObject.COMPLETE)) {
                            completeEvent = dragonBones.BaseObject.borrowObject(dragonBones.EventObject);
                            completeEvent.type = dragonBones.EventObject.COMPLETE;
                            completeEvent.armature = this._armature;
                            completeEvent.animationState = this._animationState;
                        }
                    }
                }
                if (this._frameCount > 1) {
                    const timelineData = this._timelineData;
                    const timelineFrameIndex = Math.floor(this.currentTime * this._frameRate); // uint
                    const frameIndex = this._frameIndices[timelineData.frameIndicesOffset + timelineFrameIndex];
                    if (this._frameIndex !== frameIndex) { // Arrive at frame.                   
                        let crossedFrameIndex = this._frameIndex;
                        this._frameIndex = frameIndex;
                        if (this._timelineArray !== null) {
                            this._frameOffset = this._animationData.frameOffset + this._timelineArray[timelineData.offset + 5 /* BinaryOffset.TimelineFrameOffset */ + this._frameIndex];
                            if (isReverse) {
                                if (crossedFrameIndex < 0) {
                                    const prevFrameIndex = Math.floor(prevTime * this._frameRate);
                                    crossedFrameIndex = this._frameIndices[timelineData.frameIndicesOffset + prevFrameIndex];
                                    if (this.currentPlayTimes === prevPlayTimes) { // Start.
                                        if (crossedFrameIndex === frameIndex) { // Uncrossed.
                                            crossedFrameIndex = -1;
                                        }
                                    }
                                }
                                while (crossedFrameIndex >= 0) {
                                    const frameOffset = this._animationData.frameOffset + this._timelineArray[timelineData.offset + 5 /* BinaryOffset.TimelineFrameOffset */ + crossedFrameIndex];
                                    // const framePosition = this._frameArray[frameOffset] * this._frameRateR; // Precision problem
                                    const framePosition = this._frameArray[frameOffset] / this._frameRate;
                                    if (this._position <= framePosition &&
                                        framePosition <= this._position + this._duration) { // Support interval play.
                                        this._onCrossFrame(crossedFrameIndex);
                                    }
                                    if (loopCompleteEvent !== null && crossedFrameIndex === 0) { // Add loop complete event after first frame.
                                        this._armature._dragonBones.bufferEvent(loopCompleteEvent);
                                        loopCompleteEvent = null;
                                    }
                                    if (crossedFrameIndex > 0) {
                                        crossedFrameIndex--;
                                    }
                                    else {
                                        crossedFrameIndex = this._frameCount - 1;
                                    }
                                    if (crossedFrameIndex === frameIndex) {
                                        break;
                                    }
                                }
                            }
                            else {
                                if (crossedFrameIndex < 0) {
                                    const prevFrameIndex = Math.floor(prevTime * this._frameRate);
                                    crossedFrameIndex = this._frameIndices[timelineData.frameIndicesOffset + prevFrameIndex];
                                    const frameOffset = this._animationData.frameOffset + this._timelineArray[timelineData.offset + 5 /* BinaryOffset.TimelineFrameOffset */ + crossedFrameIndex];
                                    // const framePosition = this._frameArray[frameOffset] * this._frameRateR; // Precision problem
                                    const framePosition = this._frameArray[frameOffset] / this._frameRate;
                                    if (this.currentPlayTimes === prevPlayTimes) { // Start.
                                        if (prevTime <= framePosition) { // Crossed.
                                            if (crossedFrameIndex > 0) {
                                                crossedFrameIndex--;
                                            }
                                            else {
                                                crossedFrameIndex = this._frameCount - 1;
                                            }
                                        }
                                        else if (crossedFrameIndex === frameIndex) { // Uncrossed.
                                            crossedFrameIndex = -1;
                                        }
                                    }
                                }
                                while (crossedFrameIndex >= 0) {
                                    if (crossedFrameIndex < this._frameCount - 1) {
                                        crossedFrameIndex++;
                                    }
                                    else {
                                        crossedFrameIndex = 0;
                                    }
                                    const frameOffset = this._animationData.frameOffset + this._timelineArray[timelineData.offset + 5 /* BinaryOffset.TimelineFrameOffset */ + crossedFrameIndex];
                                    // const framePosition = this._frameArray[frameOffset] * this._frameRateR; // Precision problem
                                    const framePosition = this._frameArray[frameOffset] / this._frameRate;
                                    if (this._position <= framePosition &&
                                        framePosition <= this._position + this._duration) { // Support interval play.
                                        this._onCrossFrame(crossedFrameIndex);
                                    }
                                    if (loopCompleteEvent !== null && crossedFrameIndex === 0) { // Add loop complete event before first frame.
                                        this._armature._dragonBones.bufferEvent(loopCompleteEvent);
                                        loopCompleteEvent = null;
                                    }
                                    if (crossedFrameIndex === frameIndex) {
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
                else if (this._frameIndex < 0) {
                    this._frameIndex = 0;
                    if (this._timelineData !== null) {
                        this._frameOffset = this._animationData.frameOffset + this._timelineArray[this._timelineData.offset + 5 /* BinaryOffset.TimelineFrameOffset */];
                        // Arrive at frame.
                        const framePosition = this._frameArray[this._frameOffset] / this._frameRate;
                        if (this.currentPlayTimes === prevPlayTimes) { // Start.
                            if (prevTime <= framePosition) {
                                this._onCrossFrame(this._frameIndex);
                            }
                        }
                        else if (this._position <= framePosition) { // Loop complete.
                            if (!isReverse && loopCompleteEvent !== null) { // Add loop complete event before first frame.
                                this._armature._dragonBones.bufferEvent(loopCompleteEvent);
                                loopCompleteEvent = null;
                            }
                            this._onCrossFrame(this._frameIndex);
                        }
                    }
                }
                if (loopCompleteEvent !== null) {
                    this._armature._dragonBones.bufferEvent(loopCompleteEvent);
                }
                if (completeEvent !== null) {
                    this._armature._dragonBones.bufferEvent(completeEvent);
                }
            }
        }
        setCurrentTime(value) {
            this._setCurrentTime(value);
            this._frameIndex = -1;
        }
    }
    dragonBones.ActionTimelineState = ActionTimelineState;
    /**
     * @internal
     * @private
     */
    class ZOrderTimelineState extends dragonBones.TimelineState {
        static toString() {
            return "[class dragonBones.ZOrderTimelineState]";
        }
        _onArriveAtFrame() {
            if (this.playState >= 0) {
                const count = this._frameArray[this._frameOffset + 1];
                if (count > 0) {
                    this._armature._sortZOrder(this._frameArray, this._frameOffset + 2);
                }
                else {
                    this._armature._sortZOrder(null, 0);
                }
            }
        }
        _onUpdateFrame() { }
    }
    dragonBones.ZOrderTimelineState = ZOrderTimelineState;
    /**
     * @internal
     * @private
     */
    class BoneAllTimelineState extends dragonBones.BoneTimelineState {
        static toString() {
            return "[class dragonBones.BoneAllTimelineState]";
        }
        _onArriveAtFrame() {
            super._onArriveAtFrame();
            if (this._timelineData !== null) {
                let valueOffset = this._animationData.frameFloatOffset + this._frameValueOffset + this._frameIndex * 6; // ...(timeline value offset)|xxxxxx|xxxxxx|(Value offset)xxxxx|(Next offset)xxxxx|xxxxxx|xxxxxx|...
                const scale = this._armature._armatureData.scale;
                const frameFloatArray = this._frameFloatArray;
                const current = this.bonePose.current;
                const delta = this.bonePose.delta;
                current.x = frameFloatArray[valueOffset++] * scale;
                current.y = frameFloatArray[valueOffset++] * scale;
                current.rotation = frameFloatArray[valueOffset++];
                current.skew = frameFloatArray[valueOffset++];
                current.scaleX = frameFloatArray[valueOffset++];
                current.scaleY = frameFloatArray[valueOffset++];
                if (this._tweenState === 2 /* TweenState.Always */) {
                    if (this._frameIndex === this._frameCount - 1) {
                        valueOffset = this._animationData.frameFloatOffset + this._frameValueOffset; // + 0 * 6
                    }
                    delta.x = frameFloatArray[valueOffset++] * scale - current.x;
                    delta.y = frameFloatArray[valueOffset++] * scale - current.y;
                    delta.rotation = frameFloatArray[valueOffset++] - current.rotation;
                    delta.skew = frameFloatArray[valueOffset++] - current.skew;
                    delta.scaleX = frameFloatArray[valueOffset++] - current.scaleX;
                    delta.scaleY = frameFloatArray[valueOffset++] - current.scaleY;
                }
                else {
                    delta.x = 0.0;
                    delta.y = 0.0;
                    delta.rotation = 0.0;
                    delta.skew = 0.0;
                    delta.scaleX = 0.0;
                    delta.scaleY = 0.0;
                }
            }
            else { // Pose.
                const current = this.bonePose.current;
                const delta = this.bonePose.delta;
                current.x = 0.0;
                current.y = 0.0;
                current.rotation = 0.0;
                current.skew = 0.0;
                current.scaleX = 1.0;
                current.scaleY = 1.0;
                delta.x = 0.0;
                delta.y = 0.0;
                delta.rotation = 0.0;
                delta.skew = 0.0;
                delta.scaleX = 0.0;
                delta.scaleY = 0.0;
            }
        }
        _onUpdateFrame() {
            super._onUpdateFrame();
            const current = this.bonePose.current;
            const delta = this.bonePose.delta;
            const result = this.bonePose.result;
            this.bone._transformDirty = true;
            if (this._tweenState !== 2 /* TweenState.Always */) {
                this._tweenState = 0 /* TweenState.None */;
            }
            result.x = current.x + delta.x * this._tweenProgress;
            result.y = current.y + delta.y * this._tweenProgress;
            result.rotation = current.rotation + delta.rotation * this._tweenProgress;
            result.skew = current.skew + delta.skew * this._tweenProgress;
            result.scaleX = current.scaleX + delta.scaleX * this._tweenProgress;
            result.scaleY = current.scaleY + delta.scaleY * this._tweenProgress;
        }
        fadeOut() {
            const result = this.bonePose.result;
            result.rotation = dragonBones.Transform.normalizeRadian(result.rotation);
            result.skew = dragonBones.Transform.normalizeRadian(result.skew);
        }
    }
    dragonBones.BoneAllTimelineState = BoneAllTimelineState;
    /**
     * @internal
     * @private
     */
    class BoneTranslateTimelineState extends dragonBones.BoneTimelineState {
        static toString() {
            return "[class dragonBones.BoneTranslateTimelineState]";
        }
        _onArriveAtFrame() {
            super._onArriveAtFrame();
            if (this._timelineData !== null) {
                let valueOffset = this._animationData.frameFloatOffset + this._frameValueOffset + this._frameIndex * 2;
                const scale = this._armature._armatureData.scale;
                const frameFloatArray = this._frameFloatArray;
                const current = this.bonePose.current;
                const delta = this.bonePose.delta;
                current.x = frameFloatArray[valueOffset++] * scale;
                current.y = frameFloatArray[valueOffset++] * scale;
                if (this._tweenState === 2 /* TweenState.Always */) {
                    if (this._frameIndex === this._frameCount - 1) {
                        valueOffset = this._animationData.frameFloatOffset + this._frameValueOffset; // + 0 * 2
                    }
                    delta.x = frameFloatArray[valueOffset++] * scale - current.x;
                    delta.y = frameFloatArray[valueOffset++] * scale - current.y;
                }
                else {
                    delta.x = 0.0;
                    delta.y = 0.0;
                }
            }
            else { // Pose.
                const current = this.bonePose.current;
                const delta = this.bonePose.delta;
                current.x = 0.0;
                current.y = 0.0;
                delta.x = 0.0;
                delta.y = 0.0;
            }
        }
        _onUpdateFrame() {
            super._onUpdateFrame();
            const current = this.bonePose.current;
            const delta = this.bonePose.delta;
            const result = this.bonePose.result;
            this.bone._transformDirty = true;
            if (this._tweenState !== 2 /* TweenState.Always */) {
                this._tweenState = 0 /* TweenState.None */;
            }
            result.x = (current.x + delta.x * this._tweenProgress);
            result.y = (current.y + delta.y * this._tweenProgress);
        }
    }
    dragonBones.BoneTranslateTimelineState = BoneTranslateTimelineState;
    /**
     * @internal
     * @private
     */
    class BoneRotateTimelineState extends dragonBones.BoneTimelineState {
        static toString() {
            return "[class dragonBones.BoneRotateTimelineState]";
        }
        _onArriveAtFrame() {
            super._onArriveAtFrame();
            if (this._timelineData !== null) {
                let valueOffset = this._animationData.frameFloatOffset + this._frameValueOffset + this._frameIndex * 2;
                const frameFloatArray = this._frameFloatArray;
                const current = this.bonePose.current;
                const delta = this.bonePose.delta;
                current.rotation = frameFloatArray[valueOffset++];
                current.skew = frameFloatArray[valueOffset++];
                if (this._tweenState === 2 /* TweenState.Always */) {
                    if (this._frameIndex === this._frameCount - 1) {
                        valueOffset = this._animationData.frameFloatOffset + this._frameValueOffset; // + 0 * 2
                    }
                    delta.rotation = frameFloatArray[valueOffset++] - current.rotation;
                    delta.skew = frameFloatArray[valueOffset++] - current.skew;
                }
                else {
                    delta.rotation = 0.0;
                    delta.skew = 0.0;
                }
            }
            else { // Pose.
                const current = this.bonePose.current;
                const delta = this.bonePose.delta;
                current.rotation = 0.0;
                current.skew = 0.0;
                delta.rotation = 0.0;
                delta.skew = 0.0;
            }
        }
        _onUpdateFrame() {
            super._onUpdateFrame();
            const current = this.bonePose.current;
            const delta = this.bonePose.delta;
            const result = this.bonePose.result;
            this.bone._transformDirty = true;
            if (this._tweenState !== 2 /* TweenState.Always */) {
                this._tweenState = 0 /* TweenState.None */;
            }
            result.rotation = current.rotation + delta.rotation * this._tweenProgress;
            result.skew = current.skew + delta.skew * this._tweenProgress;
        }
        fadeOut() {
            const result = this.bonePose.result;
            result.rotation = dragonBones.Transform.normalizeRadian(result.rotation);
            result.skew = dragonBones.Transform.normalizeRadian(result.skew);
        }
    }
    dragonBones.BoneRotateTimelineState = BoneRotateTimelineState;
    /**
     * @internal
     * @private
     */
    class BoneScaleTimelineState extends dragonBones.BoneTimelineState {
        static toString() {
            return "[class dragonBones.BoneScaleTimelineState]";
        }
        _onArriveAtFrame() {
            super._onArriveAtFrame();
            if (this._timelineData !== null) {
                let valueOffset = this._animationData.frameFloatOffset + this._frameValueOffset + this._frameIndex * 2;
                const frameFloatArray = this._frameFloatArray;
                const current = this.bonePose.current;
                const delta = this.bonePose.delta;
                current.scaleX = frameFloatArray[valueOffset++];
                current.scaleY = frameFloatArray[valueOffset++];
                if (this._tweenState === 2 /* TweenState.Always */) {
                    if (this._frameIndex === this._frameCount - 1) {
                        valueOffset = this._animationData.frameFloatOffset + this._frameValueOffset; // + 0 * 2
                    }
                    delta.scaleX = frameFloatArray[valueOffset++] - current.scaleX;
                    delta.scaleY = frameFloatArray[valueOffset++] - current.scaleY;
                }
                else {
                    delta.scaleX = 0.0;
                    delta.scaleY = 0.0;
                }
            }
            else { // Pose.
                const current = this.bonePose.current;
                const delta = this.bonePose.delta;
                current.scaleX = 1.0;
                current.scaleY = 1.0;
                delta.scaleX = 0.0;
                delta.scaleY = 0.0;
            }
        }
        _onUpdateFrame() {
            super._onUpdateFrame();
            const current = this.bonePose.current;
            const delta = this.bonePose.delta;
            const result = this.bonePose.result;
            this.bone._transformDirty = true;
            if (this._tweenState !== 2 /* TweenState.Always */) {
                this._tweenState = 0 /* TweenState.None */;
            }
            result.scaleX = current.scaleX + delta.scaleX * this._tweenProgress;
            result.scaleY = current.scaleY + delta.scaleY * this._tweenProgress;
        }
    }
    dragonBones.BoneScaleTimelineState = BoneScaleTimelineState;
    /**
     * @internal
     * @private
     */
    class SurfaceTimelineState extends dragonBones.TweenTimelineState {
        constructor() {
            super(...arguments);
            this._current = [];
            this._delta = [];
            this._result = [];
        }
        static toString() {
            return "[class dragonBones.SurfaceTimelineState]";
        }
        _onClear() {
            super._onClear();
            this.surface = null;
            this._frameFloatOffset = 0;
            this._valueCount = 0;
            this._deformCount = 0;
            this._valueOffset = 0;
            this._current.length = 0;
            this._delta.length = 0;
            this._result.length = 0;
        }
        _onArriveAtFrame() {
            super._onArriveAtFrame();
            if (this._timelineData !== null) {
                const valueOffset = this._animationData.frameFloatOffset + this._frameValueOffset + this._frameIndex * this._valueCount;
                const scale = this._armature._armatureData.scale;
                const frameFloatArray = this._frameFloatArray;
                if (this._tweenState === 2 /* TweenState.Always */) {
                    let nextValueOffset = valueOffset + this._valueCount;
                    if (this._frameIndex === this._frameCount - 1) {
                        nextValueOffset = this._animationData.frameFloatOffset + this._frameValueOffset;
                    }
                    for (let i = 0; i < this._valueCount; ++i) {
                        this._delta[i] = frameFloatArray[nextValueOffset + i] * scale - (this._current[i] = frameFloatArray[valueOffset + i] * scale);
                    }
                }
                else {
                    for (let i = 0; i < this._valueCount; ++i) {
                        this._current[i] = frameFloatArray[valueOffset + i] * scale;
                    }
                }
            }
            else {
                for (let i = 0; i < this._valueCount; ++i) {
                    this._current[i] = 0.0;
                }
            }
        }
        _onUpdateFrame() {
            super._onUpdateFrame();
            this.surface._transformDirty = true;
            if (this._tweenState !== 2 /* TweenState.Always */) {
                this._tweenState = 0 /* TweenState.None */;
            }
            for (let i = 0; i < this._valueCount; ++i) {
                this._result[i] = this._current[i] + this._delta[i] * this._tweenProgress;
            }
        }
        init(armature, animationState, timelineData) {
            super.init(armature, animationState, timelineData);
            if (this._timelineData !== null) {
                const frameIntOffset = this._animationData.frameIntOffset + this._timelineArray[this._timelineData.offset + 3 /* BinaryOffset.TimelineFrameValueCount */];
                this._deformCount = this._frameIntArray[frameIntOffset + 1 /* BinaryOffset.DeformCount */];
                this._valueCount = this._frameIntArray[frameIntOffset + 2 /* BinaryOffset.DeformValueCount */];
                this._valueOffset = this._frameIntArray[frameIntOffset + 3 /* BinaryOffset.DeformValueOffset */];
                this._frameFloatOffset = this._frameIntArray[frameIntOffset + 4 /* BinaryOffset.DeformFloatOffset */] + this._animationData.frameFloatOffset;
            }
            else {
                this._deformCount = this.surface._deformVertices.length;
                this._valueCount = this._deformCount;
                this._valueOffset = 0;
                this._frameFloatOffset = 0;
            }
            this._current.length = this._valueCount;
            this._delta.length = this._valueCount;
            this._result.length = this._valueCount;
            for (let i = 0; i < this._valueCount; ++i) {
                this._delta[i] = 0.0;
            }
        }
        blend(state) {
            const blendWeight = this.surface._blendState.blendWeight;
            const result = this.surface._deformVertices;
            for (let i = 0; i < this._deformCount; ++i) {
                let value = 0.0;
                if (i < this._valueOffset) {
                    value = this._frameFloatArray[this._frameFloatOffset + i];
                }
                else if (i < this._valueOffset + this._valueCount) {
                    value = this._result[i - this._valueOffset];
                }
                else {
                    value = this._frameFloatArray[this._frameFloatOffset + i - this._valueCount];
                }
                if (state === 2) {
                    result[i] += value * blendWeight;
                }
                else if (blendWeight !== 1.0) {
                    result[i] = value * blendWeight;
                }
                else {
                    result[i] = value;
                }
            }
            if (this._animationState._fadeState !== 0 || this._animationState._subFadeState !== 0) {
                this.surface._transformDirty = true;
            }
        }
    }
    dragonBones.SurfaceTimelineState = SurfaceTimelineState;
    /**
     * @internal
     * @private
     */
    class SlotDislayTimelineState extends dragonBones.SlotTimelineState {
        static toString() {
            return "[class dragonBones.SlotDislayTimelineState]";
        }
        _onArriveAtFrame() {
            if (this.playState >= 0) {
                const displayIndex = this._timelineData !== null ? this._frameArray[this._frameOffset + 1] : this.slot._slotData.displayIndex;
                if (this.slot.displayIndex !== displayIndex) {
                    this.slot._setDisplayIndex(displayIndex, true);
                }
            }
        }
    }
    dragonBones.SlotDislayTimelineState = SlotDislayTimelineState;
    /**
     * @internal
     * @private
     */
    class SlotColorTimelineState extends dragonBones.SlotTimelineState {
        constructor() {
            super(...arguments);
            this._current = [0, 0, 0, 0, 0, 0, 0, 0];
            this._delta = [0, 0, 0, 0, 0, 0, 0, 0];
            this._result = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
        }
        static toString() {
            return "[class dragonBones.SlotColorTimelineState]";
        }
        _onClear() {
            super._onClear();
            this._dirty = false;
        }
        _onArriveAtFrame() {
            super._onArriveAtFrame();
            if (this._timelineData !== null) {
                const intArray = this._dragonBonesData.intArray;
                const frameIntArray = this._frameIntArray;
                const valueOffset = this._animationData.frameIntOffset + this._frameValueOffset + this._frameIndex * 1; // ...(timeline value offset)|x|x|(Value offset)|(Next offset)|x|x|...
                let colorOffset = frameIntArray[valueOffset];
                if (colorOffset < 0) {
                    colorOffset += 65536; // Fixed out of bouds bug. 
                }
                this._current[0] = intArray[colorOffset++];
                this._current[1] = intArray[colorOffset++];
                this._current[2] = intArray[colorOffset++];
                this._current[3] = intArray[colorOffset++];
                this._current[4] = intArray[colorOffset++];
                this._current[5] = intArray[colorOffset++];
                this._current[6] = intArray[colorOffset++];
                this._current[7] = intArray[colorOffset++];
                if (this._tweenState === 2 /* TweenState.Always */) {
                    if (this._frameIndex === this._frameCount - 1) {
                        colorOffset = frameIntArray[this._animationData.frameIntOffset + this._frameValueOffset];
                    }
                    else {
                        colorOffset = frameIntArray[valueOffset + 1 * 1];
                    }
                    if (colorOffset < 0) {
                        colorOffset += 65536; // Fixed out of bouds bug. 
                    }
                    this._delta[0] = intArray[colorOffset++] - this._current[0];
                    this._delta[1] = intArray[colorOffset++] - this._current[1];
                    this._delta[2] = intArray[colorOffset++] - this._current[2];
                    this._delta[3] = intArray[colorOffset++] - this._current[3];
                    this._delta[4] = intArray[colorOffset++] - this._current[4];
                    this._delta[5] = intArray[colorOffset++] - this._current[5];
                    this._delta[6] = intArray[colorOffset++] - this._current[6];
                    this._delta[7] = intArray[colorOffset++] - this._current[7];
                }
            }
            else { // Pose.
                const color = this.slot._slotData.color;
                this._current[0] = color.alphaMultiplier * 100.0;
                this._current[1] = color.redMultiplier * 100.0;
                this._current[2] = color.greenMultiplier * 100.0;
                this._current[3] = color.blueMultiplier * 100.0;
                this._current[4] = color.alphaOffset;
                this._current[5] = color.redOffset;
                this._current[6] = color.greenOffset;
                this._current[7] = color.blueOffset;
            }
        }
        _onUpdateFrame() {
            super._onUpdateFrame();
            this._dirty = true;
            if (this._tweenState !== 2 /* TweenState.Always */) {
                this._tweenState = 0 /* TweenState.None */;
            }
            this._result[0] = (this._current[0] + this._delta[0] * this._tweenProgress) * 0.01;
            this._result[1] = (this._current[1] + this._delta[1] * this._tweenProgress) * 0.01;
            this._result[2] = (this._current[2] + this._delta[2] * this._tweenProgress) * 0.01;
            this._result[3] = (this._current[3] + this._delta[3] * this._tweenProgress) * 0.01;
            this._result[4] = this._current[4] + this._delta[4] * this._tweenProgress;
            this._result[5] = this._current[5] + this._delta[5] * this._tweenProgress;
            this._result[6] = this._current[6] + this._delta[6] * this._tweenProgress;
            this._result[7] = this._current[7] + this._delta[7] * this._tweenProgress;
        }
        fadeOut() {
            this._tweenState = 0 /* TweenState.None */;
            this._dirty = false;
        }
        update(passedTime) {
            super.update(passedTime);
            // Fade animation.
            if (this._tweenState !== 0 /* TweenState.None */ || this._dirty) {
                const result = this.slot._colorTransform;
                if (this._animationState._fadeState !== 0 || this._animationState._subFadeState !== 0) {
                    if (result.alphaMultiplier !== this._result[0] ||
                        result.redMultiplier !== this._result[1] ||
                        result.greenMultiplier !== this._result[2] ||
                        result.blueMultiplier !== this._result[3] ||
                        result.alphaOffset !== this._result[4] ||
                        result.redOffset !== this._result[5] ||
                        result.greenOffset !== this._result[6] ||
                        result.blueOffset !== this._result[7]) {
                        const fadeProgress = Math.pow(this._animationState._fadeProgress, 4);
                        result.alphaMultiplier += (this._result[0] - result.alphaMultiplier) * fadeProgress;
                        result.redMultiplier += (this._result[1] - result.redMultiplier) * fadeProgress;
                        result.greenMultiplier += (this._result[2] - result.greenMultiplier) * fadeProgress;
                        result.blueMultiplier += (this._result[3] - result.blueMultiplier) * fadeProgress;
                        result.alphaOffset += (this._result[4] - result.alphaOffset) * fadeProgress;
                        result.redOffset += (this._result[5] - result.redOffset) * fadeProgress;
                        result.greenOffset += (this._result[6] - result.greenOffset) * fadeProgress;
                        result.blueOffset += (this._result[7] - result.blueOffset) * fadeProgress;
                        this.slot._colorDirty = true;
                    }
                }
                else if (this._dirty) {
                    this._dirty = false;
                    if (result.alphaMultiplier !== this._result[0] ||
                        result.redMultiplier !== this._result[1] ||
                        result.greenMultiplier !== this._result[2] ||
                        result.blueMultiplier !== this._result[3] ||
                        result.alphaOffset !== this._result[4] ||
                        result.redOffset !== this._result[5] ||
                        result.greenOffset !== this._result[6] ||
                        result.blueOffset !== this._result[7]) {
                        result.alphaMultiplier = this._result[0];
                        result.redMultiplier = this._result[1];
                        result.greenMultiplier = this._result[2];
                        result.blueMultiplier = this._result[3];
                        result.alphaOffset = this._result[4];
                        result.redOffset = this._result[5];
                        result.greenOffset = this._result[6];
                        result.blueOffset = this._result[7];
                        this.slot._colorDirty = true;
                    }
                }
            }
        }
    }
    dragonBones.SlotColorTimelineState = SlotColorTimelineState;
    /**
     * @internal
     * @private
     */
    class SlotFFDTimelineState extends dragonBones.SlotTimelineState {
        constructor() {
            super(...arguments);
            this._current = [];
            this._delta = [];
            this._result = [];
        }
        static toString() {
            return "[class dragonBones.SlotFFDTimelineState]";
        }
        _onClear() {
            super._onClear();
            this.meshOffset = 0;
            this._dirty = false;
            this._frameFloatOffset = 0;
            this._valueCount = 0;
            this._deformCount = 0;
            this._valueOffset = 0;
            this._current.length = 0;
            this._delta.length = 0;
            this._result.length = 0;
        }
        _onArriveAtFrame() {
            super._onArriveAtFrame();
            if (this._timelineData !== null) {
                const valueOffset = this._animationData.frameFloatOffset + this._frameValueOffset + this._frameIndex * this._valueCount;
                const scale = this._armature._armatureData.scale;
                const frameFloatArray = this._frameFloatArray;
                if (this._tweenState === 2 /* TweenState.Always */) {
                    let nextValueOffset = valueOffset + this._valueCount;
                    if (this._frameIndex === this._frameCount - 1) {
                        nextValueOffset = this._animationData.frameFloatOffset + this._frameValueOffset;
                    }
                    for (let i = 0; i < this._valueCount; ++i) {
                        this._delta[i] = frameFloatArray[nextValueOffset + i] * scale - (this._current[i] = frameFloatArray[valueOffset + i] * scale);
                    }
                }
                else {
                    for (let i = 0; i < this._valueCount; ++i) {
                        this._current[i] = frameFloatArray[valueOffset + i] * scale;
                    }
                }
            }
            else {
                for (let i = 0; i < this._valueCount; ++i) {
                    this._current[i] = 0.0;
                }
            }
        }
        _onUpdateFrame() {
            super._onUpdateFrame();
            this._dirty = true;
            if (this._tweenState !== 2 /* TweenState.Always */) {
                this._tweenState = 0 /* TweenState.None */;
            }
            for (let i = 0; i < this._valueCount; ++i) {
                this._result[i] = this._current[i] + this._delta[i] * this._tweenProgress;
            }
        }
        init(armature, animationState, timelineData) {
            super.init(armature, animationState, timelineData);
            if (this._timelineData !== null) {
                const frameIntOffset = this._animationData.frameIntOffset + this._timelineArray[this._timelineData.offset + 3 /* BinaryOffset.TimelineFrameValueCount */];
                this.meshOffset = this._frameIntArray[frameIntOffset + 0 /* BinaryOffset.DeformMeshOffset */];
                if (this.meshOffset < 0) {
                    this.meshOffset += 65536; // Fixed out of bouds bug. 
                }
                this._deformCount = this._frameIntArray[frameIntOffset + 1 /* BinaryOffset.DeformCount */];
                this._valueCount = this._frameIntArray[frameIntOffset + 2 /* BinaryOffset.DeformValueCount */];
                this._valueOffset = this._frameIntArray[frameIntOffset + 3 /* BinaryOffset.DeformValueOffset */];
                this._frameFloatOffset = this._frameIntArray[frameIntOffset + 4 /* BinaryOffset.DeformFloatOffset */] + this._animationData.frameFloatOffset;
            }
            else {
                this._deformCount = this.slot._deformVertices.length;
                this._valueCount = this._deformCount;
                this._valueOffset = 0;
                this._frameFloatOffset = 0;
            }
            this._current.length = this._valueCount;
            this._delta.length = this._valueCount;
            this._result.length = this._valueCount;
            for (let i = 0; i < this._valueCount; ++i) {
                this._delta[i] = 0.0;
            }
        }
        fadeOut() {
            this._tweenState = 0 /* TweenState.None */;
            this._dirty = false;
        }
        update(passedTime) {
            if (this.slot._meshData === null || this.slot._meshData.offset !== this.meshOffset) {
                return;
            }
            super.update(passedTime);
            // Fade animation.
            if (this._tweenState !== 0 /* TweenState.None */ || this._dirty) {
                const result = this.slot._deformVertices;
                if (this._animationState._fadeState !== 0 || this._animationState._subFadeState !== 0) {
                    const fadeProgress = Math.pow(this._animationState._fadeProgress, 2);
                    for (let i = 0; i < this._deformCount; ++i) {
                        if (i < this._valueOffset) {
                            result[i] += (this._frameFloatArray[this._frameFloatOffset + i] - result[i]) * fadeProgress;
                        }
                        else if (i < this._valueOffset + this._valueCount) {
                            result[i] += (this._result[i - this._valueOffset] - result[i]) * fadeProgress;
                        }
                        else {
                            result[i] += (this._frameFloatArray[this._frameFloatOffset + i - this._valueCount] - result[i]) * fadeProgress;
                        }
                    }
                    this.slot._meshDirty = true;
                }
                else if (this._dirty) {
                    this._dirty = false;
                    for (let i = 0; i < this._deformCount; ++i) {
                        if (i < this._valueOffset) {
                            result[i] = this._frameFloatArray[this._frameFloatOffset + i];
                        }
                        else if (i < this._valueOffset + this._valueCount) {
                            result[i] = this._result[i - this._valueOffset];
                        }
                        else {
                            result[i] = this._frameFloatArray[this._frameFloatOffset + i - this._valueCount];
                        }
                    }
                    this.slot._meshDirty = true;
                }
            }
        }
    }
    dragonBones.SlotFFDTimelineState = SlotFFDTimelineState;
    /**
     * @internal
     * @private
     */
    class IKConstraintTimelineState extends dragonBones.ConstraintTimelineState {
        static toString() {
            return "[class dragonBones.IKConstraintTimelineState]";
        }
        _onClear() {
            super._onClear();
            this._current = 0.0;
            this._delta = 0.0;
        }
        _onArriveAtFrame() {
            super._onArriveAtFrame();
            const ikConstraint = this.constraint;
            if (this._timelineData !== null) {
                let valueOffset = this._animationData.frameIntOffset + this._frameValueOffset + this._frameIndex * 2;
                const frameIntArray = this._frameIntArray;
                const bendPositive = frameIntArray[valueOffset++] !== 0;
                this._current = frameIntArray[valueOffset++] * 0.01;
                if (this._tweenState === 2 /* TweenState.Always */) {
                    if (this._frameIndex === this._frameCount - 1) {
                        valueOffset = this._animationData.frameIntOffset + this._frameValueOffset; // + 0 * 2
                    }
                    this._delta = frameIntArray[valueOffset + 1] * 0.01 - this._current;
                }
                else {
                    this._delta = 0.0;
                }
                ikConstraint._bendPositive = bendPositive;
            }
            else {
                const ikConstraintData = ikConstraint._constraintData;
                this._current = ikConstraintData.weight;
                this._delta = 0.0;
                ikConstraint._bendPositive = ikConstraintData.bendPositive;
            }
            ikConstraint.invalidUpdate();
        }
        _onUpdateFrame() {
            super._onUpdateFrame();
            if (this._tweenState !== 2 /* TweenState.Always */) {
                this._tweenState = 0 /* TweenState.None */;
            }
            const ikConstraint = this.constraint;
            ikConstraint._weight = this._current + this._delta * this._tweenProgress;
            ikConstraint.invalidUpdate();
            // TODO fade update.
        }
    }
    dragonBones.IKConstraintTimelineState = IKConstraintTimelineState;
    /**
     * @internal
     * @private
     */
    class AnimationTimelineState extends dragonBones.TweenTimelineState {
        constructor() {
            super(...arguments);
            this._floats = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
        }
        static toString() {
            return "[class dragonBones.AnimationTimelineState]";
        }
        _onClear() {
            super._onClear();
            this.animationState = null;
        }
        _onArriveAtFrame() {
            super._onArriveAtFrame();
            if (this._timelineData === null) {
                return;
            }
            let valueOffset = this._animationData.frameIntOffset + this._frameValueOffset + this._frameIndex * 2;
            const frameRateR = 1.0 / this.animationState._animationData.parent.frameRate;
            const frameIntArray = this._frameIntArray;
            this._floats[0] = frameIntArray[valueOffset++] * frameRateR;
            this._floats[3] = frameIntArray[valueOffset++] * 0.01;
            if (this._tweenState === 2 /* TweenState.Always */) {
                if (this._frameIndex === this._frameCount - 1) {
                    valueOffset = this._animationData.frameIntOffset + this._frameValueOffset; // + 0 * 2
                }
                this._floats[1] = frameIntArray[valueOffset++] * frameRateR - this._floats[0];
                this._floats[4] = frameIntArray[valueOffset++] * 0.01 - this._floats[3];
            }
            else {
                this._floats[1] = 0.0;
                this._floats[4] = 0.0;
            }
        }
        _onUpdateFrame() {
            super._onUpdateFrame();
            if (this._tweenState !== 2 /* TweenState.Always */) {
                this._tweenState = 0 /* TweenState.None */;
            }
            if (this._floats[0] >= 0.0) {
                this._floats[2] = this._floats[0] + this._floats[1] * this._tweenProgress;
            }
            this._floats[5] = this._floats[3] + this._floats[4] * this._tweenProgress;
        }
        blend(state) {
            const animationState = this.animationState;
            const blendWeight = animationState._blendState.blendWeight;
            if (state === 2) {
                animationState.weight += this._floats[5] * blendWeight;
                animationState.currentTime += this._floats[2] * blendWeight;
            }
            else {
                animationState.weight = this._floats[5] * blendWeight;
                animationState.currentTime = this._floats[2] * blendWeight;
            }
        }
    }
    dragonBones.AnimationTimelineState = AnimationTimelineState;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * - The animation state is generated when the animation data is played.
     * @see dragonBones.Animation
     * @see dragonBones.AnimationData
     * @version DragonBones 3.0
     * @language en_US
     */
    /**
     * - 动画状态由播放动画数据时产生。
     * @see dragonBones.Animation
     * @see dragonBones.AnimationData
     * @version DragonBones 3.0
     * @language zh_CN
     */
    class AnimationState extends dragonBones.BaseObject {
        constructor() {
            super(...arguments);
            /**
             * @internal
             * @private
             */
            this._blendState = new BlendState();
            this._boneMask = [];
            this._boneTimelines = [];
            this._surfaceTimelines = [];
            this._slotTimelines = [];
            this._constraintTimelines = [];
            this._animationTimelines = [];
            this._poseTimelines = [];
            this._bonePoses = {};
            /**
             * @internal
             * @private
             */
            this._actionTimeline = null; // Initial value.
            this._zOrderTimeline = null; // Initial value.
            /**
             * @internal
             * @private
             */
            this._parent = null; // Initial value.
        }
        static toString() {
            return "[class dragonBones.AnimationState]";
        }
        /**
         * @private
         */
        _onClear() {
            for (const timeline of this._boneTimelines) {
                timeline.returnToPool();
            }
            for (const timeline of this._surfaceTimelines) {
                timeline.returnToPool();
            }
            for (const timeline of this._slotTimelines) {
                timeline.returnToPool();
            }
            for (const timeline of this._constraintTimelines) {
                timeline.returnToPool();
            }
            for (const timeline of this._animationTimelines) {
                timeline.returnToPool();
            }
            for (let k in this._bonePoses) {
                this._bonePoses[k].returnToPool();
                delete this._bonePoses[k];
            }
            if (this._actionTimeline !== null) {
                this._actionTimeline.returnToPool();
            }
            if (this._zOrderTimeline !== null) {
                this._zOrderTimeline.returnToPool();
            }
            this.actionEnabled = false;
            this.additiveBlending = false;
            this.displayControl = false;
            this.resetToPose = false;
            this.playTimes = 1;
            this.layer = 0;
            this.timeScale = 1.0;
            this.weight = 1.0;
            this.autoFadeOutTime = 0.0;
            this.fadeTotalTime = 0.0;
            this.name = "";
            this.group = "";
            this._timelineDirty = 2;
            this._playheadState = 0;
            this._fadeState = -1;
            this._subFadeState = -1;
            this._position = 0.0;
            this._duration = 0.0;
            this._fadeTime = 0.0;
            this._time = 0.0;
            this._fadeProgress = 0.0;
            this._weightResult = 0.0;
            this._blendState.clear();
            this._boneMask.length = 0;
            this._boneTimelines.length = 0;
            this._surfaceTimelines.length = 0;
            this._slotTimelines.length = 0;
            this._constraintTimelines.length = 0;
            this._animationTimelines.length = 0;
            this._poseTimelines.length = 0;
            // this._bonePoses.clear();
            this._animationData = null; //
            this._armature = null; //
            this._actionTimeline = null; //
            this._zOrderTimeline = null;
            this._parent = null; //
        }
        _updateTimelines() {
            { // Update constraint timelines.
                for (const constraint of this._armature._constraints) {
                    const timelineDatas = this._animationData.getConstraintTimelines(constraint.name);
                    if (timelineDatas !== null) {
                        for (const timelineData of timelineDatas) {
                            switch (timelineData.type) {
                                case 30 /* TimelineType.IKConstraint */: {
                                    const timeline = dragonBones.BaseObject.borrowObject(dragonBones.IKConstraintTimelineState);
                                    timeline.constraint = constraint;
                                    timeline.init(this._armature, this, timelineData);
                                    this._constraintTimelines.push(timeline);
                                    break;
                                }
                                default:
                                    break;
                            }
                        }
                    }
                    else if (this.resetToPose) { // Pose timeline.
                        const timeline = dragonBones.BaseObject.borrowObject(dragonBones.IKConstraintTimelineState);
                        timeline.constraint = constraint;
                        timeline.init(this._armature, this, null);
                        this._constraintTimelines.push(timeline);
                        this._poseTimelines.push(timeline);
                    }
                }
            }
            { // Update animation timelines.
                for (const animationState of this._armature.animation.getStates()) {
                    if (animationState._parent !== this) {
                        continue;
                    }
                    const timelineDatas = this._animationData.getAnimationTimelines(animationState.name);
                    if (timelineDatas === null) {
                        continue;
                    }
                    for (const timelineData of timelineDatas) {
                        switch (timelineData.type) {
                            case 40 /* TimelineType.AnimationTime */: {
                                const timeline = dragonBones.BaseObject.borrowObject(dragonBones.AnimationTimelineState);
                                timeline.animationState = animationState;
                                timeline.init(this._armature, this, timelineData);
                                this._animationTimelines.push(timeline);
                                break;
                            }
                            default:
                                break;
                        }
                    }
                }
            }
        }
        _updateBoneAndSlotTimelines() {
            { // Update bone and surface timelines.
                const boneTimelines = {};
                for (const timeline of this._boneTimelines) { // Create bone timelines map.
                    const timelineName = timeline.bone.name;
                    if (!(timelineName in boneTimelines)) {
                        boneTimelines[timelineName] = [];
                    }
                    boneTimelines[timelineName].push(timeline);
                }
                for (const bone of this._armature.getBones()) {
                    const timelineName = bone.name;
                    if (!this.containsBoneMask(timelineName)) {
                        continue;
                    }
                    if (timelineName in boneTimelines) { // Remove bone timeline from map.
                        delete boneTimelines[timelineName];
                    }
                    else if (bone._boneData.type === 0 /* BoneType.Bone */) { // Create new bone timeline.
                        const timelineDatas = this._animationData.getBoneTimelines(timelineName);
                        const bonePose = timelineName in this._bonePoses ? this._bonePoses[timelineName] : (this._bonePoses[timelineName] = dragonBones.BaseObject.borrowObject(BonePose));
                        if (timelineDatas !== null) {
                            for (const timelineData of timelineDatas) {
                                switch (timelineData.type) {
                                    case 10 /* TimelineType.BoneAll */: {
                                        const timeline = dragonBones.BaseObject.borrowObject(dragonBones.BoneAllTimelineState);
                                        timeline.bone = bone;
                                        timeline.bonePose = bonePose;
                                        timeline.init(this._armature, this, timelineData);
                                        this._boneTimelines.push(timeline);
                                        break;
                                    }
                                    case 11 /* TimelineType.BoneTranslate */: {
                                        const timeline = dragonBones.BaseObject.borrowObject(dragonBones.BoneTranslateTimelineState);
                                        timeline.bone = bone;
                                        timeline.bonePose = bonePose;
                                        timeline.init(this._armature, this, timelineData);
                                        this._boneTimelines.push(timeline);
                                        break;
                                    }
                                    case 12 /* TimelineType.BoneRotate */: {
                                        const timeline = dragonBones.BaseObject.borrowObject(dragonBones.BoneRotateTimelineState);
                                        timeline.bone = bone;
                                        timeline.bonePose = bonePose;
                                        timeline.init(this._armature, this, timelineData);
                                        this._boneTimelines.push(timeline);
                                        break;
                                    }
                                    case 13 /* TimelineType.BoneScale */: {
                                        const timeline = dragonBones.BaseObject.borrowObject(dragonBones.BoneScaleTimelineState);
                                        timeline.bone = bone;
                                        timeline.bonePose = bonePose;
                                        timeline.init(this._armature, this, timelineData);
                                        this._boneTimelines.push(timeline);
                                        break;
                                    }
                                    default:
                                        break;
                                }
                            }
                        }
                        else if (this.resetToPose) { // Pose timeline.
                            const timeline = dragonBones.BaseObject.borrowObject(dragonBones.BoneAllTimelineState);
                            timeline.bone = bone;
                            timeline.bonePose = bonePose;
                            timeline.init(this._armature, this, null);
                            this._boneTimelines.push(timeline);
                            this._poseTimelines.push(timeline);
                        }
                    }
                    else if (bone._boneData.type === 1 /* BoneType.Surface */) {
                        const timelineDatas = this._animationData.getSurfaceTimelines(timelineName);
                        if (timelineDatas !== null) {
                            for (const timelineData of timelineDatas) {
                                switch (timelineData.type) {
                                    case 50 /* TimelineType.Surface */: {
                                        const timeline = dragonBones.BaseObject.borrowObject(dragonBones.SurfaceTimelineState);
                                        timeline.surface = bone;
                                        timeline.init(this._armature, this, timelineData);
                                        this._surfaceTimelines.push(timeline);
                                        break;
                                    }
                                    default:
                                        break;
                                }
                            }
                        }
                        else if (this.resetToPose) { // Pose timeline.
                            const timeline = dragonBones.BaseObject.borrowObject(dragonBones.SurfaceTimelineState);
                            timeline.surface = bone;
                            timeline.init(this._armature, this, null);
                            this._surfaceTimelines.push(timeline);
                            this._poseTimelines.push(timeline);
                        }
                    }
                }
                for (let k in boneTimelines) { // Remove bone timelines.
                    for (const timeline of boneTimelines[k]) {
                        this._boneTimelines.splice(this._boneTimelines.indexOf(timeline), 1);
                        timeline.returnToPool();
                    }
                }
            }
            { // Update slot timelines.
                const slotTimelines = {};
                const ffdFlags = [];
                for (const timeline of this._slotTimelines) { // Create slot timelines map.
                    const timelineName = timeline.slot.name;
                    if (!(timelineName in slotTimelines)) {
                        slotTimelines[timelineName] = [];
                    }
                    slotTimelines[timelineName].push(timeline);
                }
                for (const slot of this._armature.getSlots()) {
                    const boneName = slot.parent.name;
                    if (!this.containsBoneMask(boneName)) {
                        continue;
                    }
                    const timelineName = slot.name;
                    const timelineDatas = this._animationData.getSlotTimelines(timelineName);
                    if (timelineName in slotTimelines) { // Remove slot timeline from map.
                        delete slotTimelines[timelineName];
                    }
                    else { // Create new slot timeline.
                        let displayIndexFlag = false;
                        let colorFlag = false;
                        ffdFlags.length = 0;
                        if (timelineDatas !== null) {
                            for (const timelineData of timelineDatas) {
                                switch (timelineData.type) {
                                    case 20 /* TimelineType.SlotDisplay */: {
                                        const timeline = dragonBones.BaseObject.borrowObject(dragonBones.SlotDislayTimelineState);
                                        timeline.slot = slot;
                                        timeline.init(this._armature, this, timelineData);
                                        this._slotTimelines.push(timeline);
                                        displayIndexFlag = true;
                                        break;
                                    }
                                    case 21 /* TimelineType.SlotColor */: {
                                        const timeline = dragonBones.BaseObject.borrowObject(dragonBones.SlotColorTimelineState);
                                        timeline.slot = slot;
                                        timeline.init(this._armature, this, timelineData);
                                        this._slotTimelines.push(timeline);
                                        colorFlag = true;
                                        break;
                                    }
                                    case 22 /* TimelineType.SlotFFD */: {
                                        const timeline = dragonBones.BaseObject.borrowObject(dragonBones.SlotFFDTimelineState);
                                        timeline.slot = slot;
                                        timeline.init(this._armature, this, timelineData);
                                        this._slotTimelines.push(timeline);
                                        ffdFlags.push(timeline.meshOffset);
                                        break;
                                    }
                                    default:
                                        break;
                                }
                            }
                        }
                        if (this.resetToPose) { // Pose timeline.
                            if (!displayIndexFlag) {
                                const timeline = dragonBones.BaseObject.borrowObject(dragonBones.SlotDislayTimelineState);
                                timeline.slot = slot;
                                timeline.init(this._armature, this, null);
                                this._slotTimelines.push(timeline);
                                this._poseTimelines.push(timeline);
                            }
                            if (!colorFlag) {
                                const timeline = dragonBones.BaseObject.borrowObject(dragonBones.SlotColorTimelineState);
                                timeline.slot = slot;
                                timeline.init(this._armature, this, null);
                                this._slotTimelines.push(timeline);
                                this._poseTimelines.push(timeline);
                            }
                            if (slot.rawDisplayDatas !== null) {
                                for (const displayData of slot.rawDisplayDatas) {
                                    if (displayData !== null && displayData.type === 2 /* DisplayType.Mesh */) {
                                        const meshOffset = displayData.offset;
                                        if (ffdFlags.indexOf(meshOffset) < 0) {
                                            const timeline = dragonBones.BaseObject.borrowObject(dragonBones.SlotFFDTimelineState);
                                            timeline.meshOffset = meshOffset; //
                                            timeline.slot = slot;
                                            timeline.init(this._armature, this, null);
                                            this._slotTimelines.push(timeline);
                                            this._poseTimelines.push(timeline);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                for (let k in slotTimelines) { // Remove slot timelines.
                    for (const timeline of slotTimelines[k]) {
                        this._slotTimelines.splice(this._slotTimelines.indexOf(timeline), 1);
                        timeline.returnToPool();
                    }
                }
            }
        }
        _advanceFadeTime(passedTime) {
            const isFadeOut = this._fadeState > 0;
            if (this._subFadeState < 0) { // Fade start event.
                this._subFadeState = 0;
                const eventType = isFadeOut ? dragonBones.EventObject.FADE_OUT : dragonBones.EventObject.FADE_IN;
                if (this._armature.eventDispatcher.hasDBEventListener(eventType)) {
                    const eventObject = dragonBones.BaseObject.borrowObject(dragonBones.EventObject);
                    eventObject.type = eventType;
                    eventObject.armature = this._armature;
                    eventObject.animationState = this;
                    this._armature._dragonBones.bufferEvent(eventObject);
                }
            }
            if (passedTime < 0.0) {
                passedTime = -passedTime;
            }
            this._fadeTime += passedTime;
            if (this._fadeTime >= this.fadeTotalTime) { // Fade complete.
                this._subFadeState = 1;
                this._fadeProgress = isFadeOut ? 0.0 : 1.0;
            }
            else if (this._fadeTime > 0.0) { // Fading.
                this._fadeProgress = isFadeOut ? (1.0 - this._fadeTime / this.fadeTotalTime) : (this._fadeTime / this.fadeTotalTime);
            }
            else { // Before fade.
                this._fadeProgress = isFadeOut ? 1.0 : 0.0;
            }
            if (this._subFadeState > 0) { // Fade complete event.
                if (!isFadeOut) {
                    this._playheadState |= 1; // x1
                    this._fadeState = 0;
                }
                const eventType = isFadeOut ? dragonBones.EventObject.FADE_OUT_COMPLETE : dragonBones.EventObject.FADE_IN_COMPLETE;
                if (this._armature.eventDispatcher.hasDBEventListener(eventType)) {
                    const eventObject = dragonBones.BaseObject.borrowObject(dragonBones.EventObject);
                    eventObject.type = eventType;
                    eventObject.armature = this._armature;
                    eventObject.animationState = this;
                    this._armature._dragonBones.bufferEvent(eventObject);
                }
            }
        }
        /**
         * @internal
         * @private
         */
        init(armature, animationData, animationConfig) {
            if (this._armature !== null) {
                return;
            }
            this._armature = armature;
            this._animationData = animationData;
            //
            this.resetToPose = animationConfig.resetToPose;
            this.additiveBlending = animationConfig.additiveBlending;
            this.displayControl = animationConfig.displayControl;
            this.actionEnabled = animationConfig.actionEnabled;
            this.layer = animationConfig.layer;
            this.playTimes = animationConfig.playTimes;
            this.timeScale = animationConfig.timeScale;
            this.fadeTotalTime = animationConfig.fadeInTime;
            this.autoFadeOutTime = animationConfig.autoFadeOutTime;
            this.weight = animationConfig.weight;
            this.name = animationConfig.name.length > 0 ? animationConfig.name : animationConfig.animation;
            this.group = animationConfig.group;
            if (animationConfig.pauseFadeIn) {
                this._playheadState = 2; // 10
            }
            else {
                this._playheadState = 3; // 11
            }
            if (animationConfig.duration < 0.0) {
                this._position = 0.0;
                this._duration = this._animationData.duration;
                if (animationConfig.position !== 0.0) {
                    if (this.timeScale >= 0.0) {
                        this._time = animationConfig.position;
                    }
                    else {
                        this._time = animationConfig.position - this._duration;
                    }
                }
                else {
                    this._time = 0.0;
                }
            }
            else {
                this._position = animationConfig.position;
                this._duration = animationConfig.duration;
                this._time = 0.0;
            }
            if (this.timeScale < 0.0 && this._time === 0.0) {
                this._time = -0.000001; // Turn to end.
            }
            if (this.fadeTotalTime <= 0.0) {
                this._fadeProgress = 0.999999; // Make different.
            }
            if (animationConfig.boneMask.length > 0) {
                this._boneMask.length = animationConfig.boneMask.length;
                for (let i = 0, l = this._boneMask.length; i < l; ++i) {
                    this._boneMask[i] = animationConfig.boneMask[i];
                }
            }
            this._actionTimeline = dragonBones.BaseObject.borrowObject(dragonBones.ActionTimelineState);
            this._actionTimeline.init(this._armature, this, this._animationData.actionTimeline);
            this._actionTimeline.currentTime = this._time;
            if (this._actionTimeline.currentTime < 0.0) {
                this._actionTimeline.currentTime = this._duration - this._actionTimeline.currentTime;
            }
            if (this._animationData.zOrderTimeline !== null) {
                this._zOrderTimeline = dragonBones.BaseObject.borrowObject(dragonBones.ZOrderTimelineState);
                this._zOrderTimeline.init(this._armature, this, this._animationData.zOrderTimeline);
            }
        }
        /**
         * @internal
         * @private
         */
        advanceTime(passedTime, cacheFrameRate) {
            this._blendState.dirty = false;
            // Update fade time.
            if (this._fadeState !== 0 || this._subFadeState !== 0) {
                this._advanceFadeTime(passedTime);
            }
            // Update time.
            if (this._playheadState === 3) { // 11
                if (this.timeScale !== 1.0) {
                    passedTime *= this.timeScale;
                }
                this._time += passedTime;
            }
            // Update timeline.
            if (this._timelineDirty !== 0) {
                if (this._timelineDirty === 2) {
                    this._updateTimelines();
                }
                this._timelineDirty = 0;
                this._updateBoneAndSlotTimelines();
            }
            if (this.weight === 0.0) {
                return;
            }
            const isCacheEnabled = this._fadeState === 0 && cacheFrameRate > 0.0;
            let isUpdateTimeline = true;
            let isUpdateBoneTimeline = true;
            let time = this._time;
            this._weightResult = this.weight * this._fadeProgress;
            if (this._parent !== null) {
                this._weightResult *= this._parent._weightResult / this._parent._fadeProgress;
            }
            if (this._actionTimeline.playState <= 0) {
                this._actionTimeline.update(time); // Update main timeline.
            }
            if (isCacheEnabled) { // Cache time internval.
                const internval = cacheFrameRate * 2.0;
                this._actionTimeline.currentTime = Math.floor(this._actionTimeline.currentTime * internval) / internval;
            }
            if (this._zOrderTimeline !== null && this._zOrderTimeline.playState <= 0) { // Update zOrder timeline.
                this._zOrderTimeline.update(time);
            }
            if (isCacheEnabled) { // Update cache.
                const cacheFrameIndex = Math.floor(this._actionTimeline.currentTime * cacheFrameRate); // uint
                if (this._armature._cacheFrameIndex === cacheFrameIndex) { // Same cache.
                    isUpdateTimeline = false;
                    isUpdateBoneTimeline = false;
                }
                else {
                    this._armature._cacheFrameIndex = cacheFrameIndex;
                    if (this._animationData.cachedFrames[cacheFrameIndex]) { // Cached.
                        isUpdateBoneTimeline = false;
                    }
                    else { // Cache.
                        this._animationData.cachedFrames[cacheFrameIndex] = true;
                    }
                }
            }
            if (isUpdateTimeline) {
                if (isUpdateBoneTimeline) { // Update bone timelines.
                    for (let i = 0, l = this._boneTimelines.length; i < l; ++i) {
                        const timeline = this._boneTimelines[i];
                        if (timeline.playState <= 0) {
                            timeline.update(time);
                        }
                        if (i === l - 1 || timeline.bone !== this._boneTimelines[i + 1].bone) {
                            const state = timeline.bone._blendState.update(this._weightResult, this.layer);
                            if (state !== 0) {
                                timeline.blend(state);
                            }
                        }
                    }
                }
                for (let i = 0, l = this._surfaceTimelines.length; i < l; ++i) {
                    const timeline = this._surfaceTimelines[i];
                    const state = timeline.surface._blendState.update(this._weightResult, this.layer);
                    if (timeline.playState <= 0) {
                        timeline.update(time);
                    }
                    if (state !== 0) {
                        timeline.blend(state);
                    }
                }
                if (this.displayControl) {
                    for (let i = 0, l = this._slotTimelines.length; i < l; ++i) {
                        const timeline = this._slotTimelines[i];
                        const displayController = timeline.slot.displayController;
                        if (displayController === null ||
                            displayController === this.name ||
                            displayController === this.group) {
                            if (timeline.playState <= 0) {
                                timeline.update(time);
                            }
                        }
                    }
                }
                for (let i = 0, l = this._constraintTimelines.length; i < l; ++i) {
                    const timeline = this._constraintTimelines[i];
                    if (timeline.playState <= 0) {
                        timeline.update(time);
                    }
                }
                for (let i = 0, l = this._animationTimelines.length; i < l; ++i) {
                    const timeline = this._animationTimelines[i];
                    const state = timeline.animationState._blendState.update(this._weightResult, this.layer);
                    if (timeline.playState <= 0) {
                        timeline.update(time);
                    }
                    if (state !== 0) {
                        timeline.blend(state);
                    }
                }
            }
            if (this._fadeState === 0) {
                if (this._subFadeState > 0) {
                    this._subFadeState = 0;
                    if (this._poseTimelines.length > 0) { // Remove pose timelines.
                        for (const timeline of this._poseTimelines) {
                            if (timeline instanceof dragonBones.BoneTimelineState) {
                                this._boneTimelines.splice(this._boneTimelines.indexOf(timeline), 1);
                            }
                            else if (timeline instanceof dragonBones.SurfaceTimelineState) {
                                this._surfaceTimelines.splice(this._surfaceTimelines.indexOf(timeline), 1);
                            }
                            else if (timeline instanceof dragonBones.SlotTimelineState) {
                                this._slotTimelines.splice(this._slotTimelines.indexOf(timeline), 1);
                            }
                            else if (timeline instanceof dragonBones.ConstraintTimelineState) {
                                this._constraintTimelines.splice(this._constraintTimelines.indexOf(timeline), 1);
                            }
                            timeline.returnToPool();
                        }
                        this._poseTimelines.length = 0;
                    }
                }
                if (this._actionTimeline.playState > 0) {
                    if (this.autoFadeOutTime >= 0.0) { // Auto fade out.
                        this.fadeOut(this.autoFadeOutTime);
                    }
                }
            }
        }
        /**
         * - Continue play.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 继续播放。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        play() {
            this._playheadState = 3; // 11
        }
        /**
         * - Stop play.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 暂停播放。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        stop() {
            this._playheadState &= 1; // 0x
        }
        /**
         * - Fade out the animation state.
         * @param fadeOutTime - The fade out time. (In seconds)
         * @param pausePlayhead - Whether to pause the animation playing when fade out.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 淡出动画状态。
         * @param fadeOutTime - 淡出时间。 （以秒为单位）
         * @param pausePlayhead - 淡出时是否暂停播放。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        fadeOut(fadeOutTime, pausePlayhead = true) {
            if (fadeOutTime < 0.0) {
                fadeOutTime = 0.0;
            }
            if (pausePlayhead) {
                this._playheadState &= 2; // x0
            }
            if (this._fadeState > 0) {
                if (fadeOutTime > this.fadeTotalTime - this._fadeTime) { // If the animation is already in fade out, the new fade out will be ignored.
                    return;
                }
            }
            else {
                this._fadeState = 1;
                this._subFadeState = -1;
                if (fadeOutTime <= 0.0 || this._fadeProgress <= 0.0) {
                    this._fadeProgress = 0.000001; // Modify fade progress to different value.
                }
                for (const timeline of this._boneTimelines) {
                    timeline.fadeOut();
                }
                for (const timeline of this._surfaceTimelines) {
                    timeline.fadeOut();
                }
                for (const timeline of this._slotTimelines) {
                    timeline.fadeOut();
                }
                for (const timeline of this._constraintTimelines) {
                    timeline.fadeOut();
                }
                for (const timeline of this._animationTimelines) {
                    timeline.animationState.fadeOut(fadeOutTime, pausePlayhead);
                    timeline.fadeOut();
                }
            }
            this.displayControl = false; //
            this.fadeTotalTime = this._fadeProgress > 0.000001 ? fadeOutTime / this._fadeProgress : 0.0;
            this._fadeTime = this.fadeTotalTime * (1.0 - this._fadeProgress);
        }
        /**
         * - Check if a specific bone mask is included.
         * @param name - The bone name.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 检查是否包含特定骨骼遮罩。
         * @param name - 骨骼名称。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        containsBoneMask(name) {
            return this._boneMask.length === 0 || this._boneMask.indexOf(name) >= 0;
        }
        /**
         * - Add a specific bone mask.
         * @param name - The bone name.
         * @param recursive - Whether or not to add a mask to the bone's sub-bone.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 添加特定的骨骼遮罩。
         * @param name - 骨骼名称。
         * @param recursive - 是否为该骨骼的子骨骼添加遮罩。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        addBoneMask(name, recursive = true) {
            const currentBone = this._armature.getBone(name);
            if (currentBone === null) {
                return;
            }
            if (this._boneMask.indexOf(name) < 0) { // Add mixing
                this._boneMask.push(name);
            }
            if (recursive) { // Add recursive mixing.
                for (const bone of this._armature.getBones()) {
                    if (this._boneMask.indexOf(bone.name) < 0 && currentBone.contains(bone)) {
                        this._boneMask.push(bone.name);
                    }
                }
            }
            this._timelineDirty = 1;
        }
        /**
         * - Remove the mask of a specific bone.
         * @param name - The bone name.
         * @param recursive - Whether to remove the bone's sub-bone mask.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 删除特定骨骼的遮罩。
         * @param name - 骨骼名称。
         * @param recursive - 是否删除该骨骼的子骨骼遮罩。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        removeBoneMask(name, recursive = true) {
            const index = this._boneMask.indexOf(name);
            if (index >= 0) { // Remove mixing.
                this._boneMask.splice(index, 1);
            }
            if (recursive) {
                const currentBone = this._armature.getBone(name);
                if (currentBone !== null) {
                    const bones = this._armature.getBones();
                    if (this._boneMask.length > 0) { // Remove recursive mixing.
                        for (const bone of bones) {
                            const index = this._boneMask.indexOf(bone.name);
                            if (index >= 0 && currentBone.contains(bone)) {
                                this._boneMask.splice(index, 1);
                            }
                        }
                    }
                    else { // Add unrecursive mixing.
                        for (const bone of bones) {
                            if (bone === currentBone) {
                                continue;
                            }
                            if (!currentBone.contains(bone)) {
                                this._boneMask.push(bone.name);
                            }
                        }
                    }
                }
            }
            this._timelineDirty = 1;
        }
        /**
         * - Remove all bone masks.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 删除所有骨骼遮罩。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        removeAllBoneMask() {
            this._boneMask.length = 0;
            this._timelineDirty = 1;
        }
        /**
         * - Whether the animation state is fading in.
         * @version DragonBones 5.1
         * @language en_US
         */
        /**
         * - 是否正在淡入。
         * @version DragonBones 5.1
         * @language zh_CN
         */
        get isFadeIn() {
            return this._fadeState < 0;
        }
        /**
         * - Whether the animation state is fading out.
         * @version DragonBones 5.1
         * @language en_US
         */
        /**
         * - 是否正在淡出。
         * @version DragonBones 5.1
         * @language zh_CN
         */
        get isFadeOut() {
            return this._fadeState > 0;
        }
        /**
         * - Whether the animation state is fade completed.
         * @version DragonBones 5.1
         * @language en_US
         */
        /**
         * - 是否淡入或淡出完毕。
         * @version DragonBones 5.1
         * @language zh_CN
         */
        get isFadeComplete() {
            return this._fadeState === 0;
        }
        /**
         * - Whether the animation state is playing.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 是否正在播放。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        get isPlaying() {
            return (this._playheadState & 2) !== 0 && this._actionTimeline.playState <= 0;
        }
        /**
         * - Whether the animation state is play completed.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 是否播放完毕。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        get isCompleted() {
            return this._actionTimeline.playState > 0;
        }
        /**
         * - The times has been played.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 已经循环播放的次数。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        get currentPlayTimes() {
            return this._actionTimeline.currentPlayTimes;
        }
        /**
         * - The total time. (In seconds)
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 总播放时间。 （以秒为单位）
         * @version DragonBones 3.0
         * @language zh_CN
         */
        get totalTime() {
            return this._duration;
        }
        /**
         * - The time is currently playing. (In seconds)
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 当前播放的时间。 （以秒为单位）
         * @version DragonBones 3.0
         * @language zh_CN
         */
        get currentTime() {
            return this._actionTimeline.currentTime;
        }
        set currentTime(value) {
            const currentPlayTimes = this._actionTimeline.currentPlayTimes - (this._actionTimeline.playState > 0 ? 1 : 0);
            if (value < 0 || this._duration < value) {
                value = (value % this._duration) + currentPlayTimes * this._duration;
                if (value < 0) {
                    value += this._duration;
                }
            }
            if (this.playTimes > 0 && currentPlayTimes === this.playTimes - 1 && value === this._duration) {
                value = this._duration - 0.000001;
            }
            if (this._time === value) {
                return;
            }
            this._time = value;
            this._actionTimeline.setCurrentTime(this._time);
            if (this._zOrderTimeline !== null) {
                this._zOrderTimeline.playState = -1;
            }
            for (const timeline of this._boneTimelines) {
                timeline.playState = -1;
            }
            for (const timeline of this._slotTimelines) {
                timeline.playState = -1;
            }
        }
        /**
         * - The animation data.
         * @see dragonBones.AnimationData
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 动画数据。
         * @see dragonBones.AnimationData
         * @version DragonBones 3.0
         * @language zh_CN
         */
        get animationData() {
            return this._animationData;
        }
    }
    dragonBones.AnimationState = AnimationState;
    /**
     * @internal
     * @private
     */
    class BonePose extends dragonBones.BaseObject {
        constructor() {
            super(...arguments);
            this.current = new dragonBones.Transform();
            this.delta = new dragonBones.Transform();
            this.result = new dragonBones.Transform();
        }
        static toString() {
            return "[class dragonBones.BonePose]";
        }
        _onClear() {
            this.current.identity();
            this.delta.identity();
            this.result.identity();
        }
    }
    dragonBones.BonePose = BonePose;
    /**
     * @internal
     * @private
     */
    class BlendState {
        /**
         * -1: First blending, 0: No blending, 1: Blending.
         */
        update(weight, p_layer) {
            if (this.dirty) {
                if (this.leftWeight > 0.0) {
                    if (this.layer !== p_layer) {
                        if (this.layerWeight >= this.leftWeight) {
                            this.leftWeight = 0.0;
                            return 0;
                        }
                        else {
                            this.layer = p_layer;
                            this.leftWeight -= this.layerWeight;
                            this.layerWeight = 0.0;
                        }
                    }
                }
                else {
                    return 0;
                }
                weight *= this.leftWeight;
                this.layerWeight += weight;
                this.blendWeight = weight;
                return 2;
            }
            this.dirty = true;
            this.layer = p_layer;
            this.layerWeight = weight;
            this.leftWeight = 1.0;
            this.blendWeight = weight;
            return 1;
        }
        clear() {
            this.dirty = false;
            this.layer = 0;
            this.leftWeight = 0.0;
            this.layerWeight = 0.0;
            this.blendWeight = 0.0;
        }
    }
    dragonBones.BlendState = BlendState;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * - The animation player is used to play the animation data and manage the animation states.
     * @see dragonBones.AnimationData
     * @see dragonBones.AnimationState
     * @version DragonBones 3.0
     * @language en_US
     */
    /**
     * - 动画播放器用来播放动画数据和管理动画状态。
     * @see dragonBones.AnimationData
     * @see dragonBones.AnimationState
     * @version DragonBones 3.0
     * @language zh_CN
     */
    class Animation extends dragonBones.BaseObject {
        constructor() {
            super(...arguments);
            this._animationNames = [];
            this._animationStates = [];
            this._animations = {};
            this._animationConfig = null; // Initial value.
        }
        static toString() {
            return "[class dragonBones.Animation]";
        }
        /**
         * @private
         */
        _onClear() {
            for (const animationState of this._animationStates) {
                animationState.returnToPool();
            }
            for (let k in this._animations) {
                delete this._animations[k];
            }
            if (this._animationConfig !== null) {
                this._animationConfig.returnToPool();
            }
            this.timeScale = 1.0;
            this._lockUpdate = false;
            this._animationDirty = false;
            this._inheritTimeScale = 1.0;
            this._animationNames.length = 0;
            this._animationStates.length = 0;
            //this._animations.clear();
            this._armature = null; //
            this._animationConfig = null; //
            this._lastAnimationState = null;
        }
        _fadeOut(animationConfig) {
            switch (animationConfig.fadeOutMode) {
                case 1 /* AnimationFadeOutMode.SameLayer */:
                    for (const animationState of this._animationStates) {
                        if (animationState._parent !== null) {
                            continue;
                        }
                        if (animationState.layer === animationConfig.layer) {
                            animationState.fadeOut(animationConfig.fadeOutTime, animationConfig.pauseFadeOut);
                        }
                    }
                    break;
                case 2 /* AnimationFadeOutMode.SameGroup */:
                    for (const animationState of this._animationStates) {
                        if (animationState._parent !== null) {
                            continue;
                        }
                        if (animationState.group === animationConfig.group) {
                            animationState.fadeOut(animationConfig.fadeOutTime, animationConfig.pauseFadeOut);
                        }
                    }
                    break;
                case 3 /* AnimationFadeOutMode.SameLayerAndGroup */:
                    for (const animationState of this._animationStates) {
                        if (animationState._parent !== null) {
                            continue;
                        }
                        if (animationState.layer === animationConfig.layer &&
                            animationState.group === animationConfig.group) {
                            animationState.fadeOut(animationConfig.fadeOutTime, animationConfig.pauseFadeOut);
                        }
                    }
                    break;
                case 4 /* AnimationFadeOutMode.All */:
                    for (const animationState of this._animationStates) {
                        if (animationState._parent !== null) {
                            continue;
                        }
                        animationState.fadeOut(animationConfig.fadeOutTime, animationConfig.pauseFadeOut);
                    }
                    break;
                case 0 /* AnimationFadeOutMode.None */:
                case 5 /* AnimationFadeOutMode.Single */:
                default:
                    break;
            }
        }
        /**
         * @internal
         * @private
         */
        init(armature) {
            if (this._armature !== null) {
                return;
            }
            this._armature = armature;
            this._animationConfig = dragonBones.BaseObject.borrowObject(dragonBones.AnimationConfig);
        }
        /**
         * @internal
         * @private
         */
        advanceTime(passedTime) {
            if (passedTime < 0.0) { // Only animationState can reverse play.
                passedTime = -passedTime;
            }
            if (this._armature.inheritAnimation && this._armature._parent !== null) { // Inherit parent animation timeScale.
                this._inheritTimeScale = this._armature._parent._armature.animation._inheritTimeScale * this.timeScale;
            }
            else {
                this._inheritTimeScale = this.timeScale;
            }
            if (this._inheritTimeScale !== 1.0) {
                passedTime *= this._inheritTimeScale;
            }
            const animationStateCount = this._animationStates.length;
            if (animationStateCount === 1) {
                const animationState = this._animationStates[0];
                if (animationState._fadeState > 0 && animationState._subFadeState > 0) {
                    this._armature._dragonBones.bufferObject(animationState);
                    this._animationStates.length = 0;
                    this._lastAnimationState = null;
                }
                else {
                    const animationData = animationState._animationData;
                    const cacheFrameRate = animationData.cacheFrameRate;
                    if (this._animationDirty && cacheFrameRate > 0.0) { // Update cachedFrameIndices.
                        this._animationDirty = false;
                        for (const bone of this._armature.getBones()) {
                            bone._cachedFrameIndices = animationData.getBoneCachedFrameIndices(bone.name);
                        }
                        for (const slot of this._armature.getSlots()) {
                            slot._cachedFrameIndices = animationData.getSlotCachedFrameIndices(slot.name);
                        }
                    }
                    animationState.advanceTime(passedTime, cacheFrameRate);
                }
            }
            else if (animationStateCount > 1) {
                for (let i = 0, r = 0; i < animationStateCount; ++i) {
                    const animationState = this._animationStates[i];
                    if (animationState._fadeState > 0 && animationState._subFadeState > 0) {
                        r++;
                        this._armature._dragonBones.bufferObject(animationState);
                        this._animationDirty = true;
                        if (this._lastAnimationState === animationState) { // Update last animation state.
                            this._lastAnimationState = null;
                        }
                    }
                    else {
                        if (r > 0) {
                            this._animationStates[i - r] = animationState;
                        }
                        animationState.advanceTime(passedTime, 0.0);
                    }
                    if (i === animationStateCount - 1 && r > 0) { // Modify animation states size.
                        this._animationStates.length -= r;
                        if (this._lastAnimationState === null && this._animationStates.length > 0) {
                            this._lastAnimationState = this._animationStates[this._animationStates.length - 1];
                        }
                    }
                }
                this._armature._cacheFrameIndex = -1;
            }
            else {
                this._armature._cacheFrameIndex = -1;
            }
        }
        /**
         * - Clear all animations states.
         * @see dragonBones.AnimationState
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 清除所有的动画状态。
         * @see dragonBones.AnimationState
         * @version DragonBones 4.5
         * @language zh_CN
         */
        reset() {
            for (const animationState of this._animationStates) {
                animationState.returnToPool();
            }
            this._animationDirty = false;
            this._animationConfig.clear();
            this._animationStates.length = 0;
            this._lastAnimationState = null;
        }
        /**
         * - Pause a specific animation state.
         * @param animationName - The name of animation state. (If not set, it will pause all animations)
         * @see dragonBones.AnimationState
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 暂停指定动画状态的播放。
         * @param animationName - 动画状态名称。 （如果未设置，则暂停所有动画）
         * @see dragonBones.AnimationState
         * @version DragonBones 3.0
         * @language zh_CN
         */
        stop(animationName = null) {
            if (animationName !== null) {
                const animationState = this.getState(animationName);
                if (animationState !== null) {
                    animationState.stop();
                }
            }
            else {
                for (const animationState of this._animationStates) {
                    animationState.stop();
                }
            }
        }
        /**
         * - Play animation with a specific animation config.
         * The API is still in the experimental phase and may encounter bugs or stability or compatibility issues when used.
         * @param animationConfig - The animation config.
         * @returns The playing animation state.
         * @see dragonBones.AnimationConfig
         * @beta
         * @version DragonBones 5.0
         * @language en_US
         */
        /**
         * - 通过指定的动画配置来播放动画。
         * 该 API 仍在实验阶段，使用时可能遭遇 bug 或稳定性或兼容性问题。
         * @param animationConfig - 动画配置。
         * @returns 播放的动画状态。
         * @see dragonBones.AnimationConfig
         * @beta
         * @version DragonBones 5.0
         * @language zh_CN
         */
        playConfig(animationConfig) {
            const animationName = animationConfig.animation;
            if (!(animationName in this._animations)) {
                console.warn("Non-existent animation.\n", "DragonBones name: " + this._armature.armatureData.parent.name, "Armature name: " + this._armature.name, "Animation name: " + animationName);
                return null;
            }
            const animationData = this._animations[animationName];
            if (animationConfig.fadeOutMode === 5 /* AnimationFadeOutMode.Single */) {
                for (const animationState of this._animationStates) {
                    if (animationState._animationData === animationData) {
                        return animationState;
                    }
                }
            }
            if (this._animationStates.length === 0) {
                animationConfig.fadeInTime = 0.0;
            }
            else if (animationConfig.fadeInTime < 0.0) {
                animationConfig.fadeInTime = animationData.fadeInTime;
            }
            if (animationConfig.fadeOutTime < 0.0) {
                animationConfig.fadeOutTime = animationConfig.fadeInTime;
            }
            if (animationConfig.timeScale <= -100.0) {
                animationConfig.timeScale = 1.0 / animationData.scale;
            }
            if (animationData.frameCount > 1) {
                if (animationConfig.position < 0.0) {
                    animationConfig.position %= animationData.duration;
                    animationConfig.position = animationData.duration - animationConfig.position;
                }
                else if (animationConfig.position === animationData.duration) {
                    animationConfig.position -= 0.000001; // Play a little time before end.
                }
                else if (animationConfig.position > animationData.duration) {
                    animationConfig.position %= animationData.duration;
                }
                if (animationConfig.duration > 0.0 && animationConfig.position + animationConfig.duration > animationData.duration) {
                    animationConfig.duration = animationData.duration - animationConfig.position;
                }
                if (animationConfig.playTimes < 0) {
                    animationConfig.playTimes = animationData.playTimes;
                }
            }
            else {
                animationConfig.playTimes = 1;
                animationConfig.position = 0.0;
                if (animationConfig.duration > 0.0) {
                    animationConfig.duration = 0.0;
                }
            }
            if (animationConfig.duration === 0.0) {
                animationConfig.duration = -1.0;
            }
            this._fadeOut(animationConfig);
            const animationState = dragonBones.BaseObject.borrowObject(dragonBones.AnimationState);
            animationState.init(this._armature, animationData, animationConfig);
            this._animationDirty = true;
            this._armature._cacheFrameIndex = -1;
            if (this._animationStates.length > 0) {
                let added = false;
                for (let i = 0, l = this._animationStates.length; i < l; ++i) {
                    if (animationState.layer > this._animationStates[i].layer) {
                        added = true;
                        this._animationStates.splice(i, 0, animationState);
                        break;
                    }
                    else if (i !== l - 1 && animationState.layer > this._animationStates[i + 1].layer) {
                        added = true;
                        this._animationStates.splice(i + 1, 0, animationState);
                        break;
                    }
                }
                if (!added) {
                    this._animationStates.push(animationState);
                }
            }
            else {
                this._animationStates.push(animationState);
            }
            // Child armature play same name animation.
            for (const slot of this._armature.getSlots()) {
                const childArmature = slot.childArmature;
                if (childArmature !== null && childArmature.inheritAnimation &&
                    childArmature.animation.hasAnimation(animationName) &&
                    childArmature.animation.getState(animationName) === null) {
                    childArmature.animation.fadeIn(animationName); //
                }
            }
            let isLocked = false;
            for (let k in animationData.animationTimelines) {
                if (!this._lockUpdate) {
                    isLocked = true;
                    this._lockUpdate = true;
                }
                const childAnimatiionState = this.fadeIn(k, animationConfig.fadeInTime, 1, animationState.layer, null, 0 /* AnimationFadeOutMode.None */);
                if (childAnimatiionState !== null) {
                    childAnimatiionState.resetToPose = false;
                    childAnimatiionState._parent = animationState;
                    childAnimatiionState.stop();
                }
            }
            if (isLocked) {
                this._lockUpdate = false;
            }
            if (!this._lockUpdate) {
                if (animationConfig.fadeInTime <= 0.0) { // Blend animation state, update armature.
                    this._armature.advanceTime(0.0);
                }
                this._lastAnimationState = animationState;
            }
            return animationState;
        }
        /**
         * - Play a specific animation.
         * @param animationName - The name of animation data. (If not set, The default animation will be played, or resume the animation playing from pause status, or replay the last playing animation)
         * @param playTimes - Playing repeat times. [-1: Use default value of the animation data, 0: No end loop playing, [1~N]: Repeat N times] (default: -1)
         * @returns The playing animation state.
         * @example
         * <pre>
         *     armature.animation.play("walk");
         * </pre>
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 播放指定动画。
         * @param animationName - 动画数据名称。 （如果未设置，则播放默认动画，或将暂停状态切换为播放状态，或重新播放之前播放的动画）
         * @param playTimes - 循环播放次数。 [-1: 使用动画数据默认值, 0: 无限循环播放, [1~N]: 循环播放 N 次] （默认: -1）
         * @returns 播放的动画状态。
         * @example
         * <pre>
         *     armature.animation.play("walk");
         * </pre>
         * @version DragonBones 3.0
         * @language zh_CN
         */
        play(animationName = null, playTimes = -1) {
            this._animationConfig.clear();
            this._animationConfig.resetToPose = true;
            this._animationConfig.playTimes = playTimes;
            this._animationConfig.fadeInTime = 0.0;
            this._animationConfig.animation = animationName !== null ? animationName : "";
            if (animationName !== null && animationName.length > 0) {
                this.playConfig(this._animationConfig);
            }
            else if (this._lastAnimationState === null) {
                const defaultAnimation = this._armature.armatureData.defaultAnimation;
                if (defaultAnimation !== null) {
                    this._animationConfig.animation = defaultAnimation.name;
                    this.playConfig(this._animationConfig);
                }
            }
            else if (!this._lastAnimationState.isPlaying && !this._lastAnimationState.isCompleted) {
                this._lastAnimationState.play();
            }
            else {
                this._animationConfig.animation = this._lastAnimationState.name;
                this.playConfig(this._animationConfig);
            }
            return this._lastAnimationState;
        }
        /**
         * - Fade in a specific animation.
         * @param animationName - The name of animation data.
         * @param fadeInTime - The fade in time. [-1: Use the default value of animation data, [0~N]: The fade in time (In seconds)] (Default: -1)
         * @param playTimes - playing repeat times. [-1: Use the default value of animation data, 0: No end loop playing, [1~N]: Repeat N times] (Default: -1)
         * @param layer - The blending layer, the animation states in high level layer will get the blending weights with high priority, when the total blending weights are more than 1.0, there will be no more weights can be allocated to the other animation states. (Default: 0)
         * @param group - The blending group name, it is typically used to specify the substitution of multiple animation states blending. (Default: null)
         * @param fadeOutMode - The fade out mode, which is typically used to specify alternate mode of multiple animation states blending. (Default: AnimationFadeOutMode.SameLayerAndGroup)
         * @returns The playing animation state.
         * @example
         * <pre>
         *     armature.animation.fadeIn("walk", 0.3, 0, 0, "normalGroup").resetToPose = false;
         *     armature.animation.fadeIn("attack", 0.3, 1, 0, "attackGroup").resetToPose = false;
         * </pre>
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 淡入播放指定的动画。
         * @param animationName - 动画数据名称。
         * @param fadeInTime - 淡入时间。 [-1: 使用动画数据默认值, [0~N]: 淡入时间 (以秒为单位)] （默认: -1）
         * @param playTimes - 播放次数。 [-1: 使用动画数据默认值, 0: 无限循环播放, [1~N]: 循环播放 N 次] （默认: -1）
         * @param layer - 混合图层，图层高的动画状态会优先获取混合权重，当混合权重分配总和超过 1.0 时，剩余的动画状态将不能再获得权重分配。 （默认: 0）
         * @param group - 混合组名称，该属性通常用来指定多个动画状态混合时的相互替换关系。 （默认: null）
         * @param fadeOutMode - 淡出模式，该属性通常用来指定多个动画状态混合时的相互替换模式。 （默认: AnimationFadeOutMode.SameLayerAndGroup）
         * @returns 播放的动画状态。
         * @example
         * <pre>
         *     armature.animation.fadeIn("walk", 0.3, 0, 0, "normalGroup").resetToPose = false;
         *     armature.animation.fadeIn("attack", 0.3, 1, 0, "attackGroup").resetToPose = false;
         * </pre>
         * @version DragonBones 4.5
         * @language zh_CN
         */
        fadeIn(animationName, fadeInTime = -1.0, playTimes = -1, layer = 0, group = null, fadeOutMode = 3 /* AnimationFadeOutMode.SameLayerAndGroup */) {
            this._animationConfig.clear();
            this._animationConfig.fadeOutMode = fadeOutMode;
            this._animationConfig.playTimes = playTimes;
            this._animationConfig.layer = layer;
            this._animationConfig.fadeInTime = fadeInTime;
            this._animationConfig.animation = animationName;
            this._animationConfig.group = group !== null ? group : "";
            return this.playConfig(this._animationConfig);
        }
        /**
         * - Play a specific animation from the specific time.
         * @param animationName - The name of animation data.
         * @param time - The start time point of playing. (In seconds)
         * @param playTimes - Playing repeat times. [-1: Use the default value of animation data, 0: No end loop playing, [1~N]: Repeat N times] (Default: -1)
         * @returns The played animation state.
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 从指定时间开始播放指定的动画。
         * @param animationName - 动画数据名称。
         * @param time - 播放开始的时间。 (以秒为单位)
         * @param playTimes - 循环播放次数。 [-1: 使用动画数据默认值, 0: 无限循环播放, [1~N]: 循环播放 N 次] （默认: -1）
         * @returns 播放的动画状态。
         * @version DragonBones 4.5
         * @language zh_CN
         */
        gotoAndPlayByTime(animationName, time = 0.0, playTimes = -1) {
            this._animationConfig.clear();
            this._animationConfig.resetToPose = true;
            this._animationConfig.playTimes = playTimes;
            this._animationConfig.position = time;
            this._animationConfig.fadeInTime = 0.0;
            this._animationConfig.animation = animationName;
            return this.playConfig(this._animationConfig);
        }
        /**
         * - Play a specific animation from the specific frame.
         * @param animationName - The name of animation data.
         * @param frame - The start frame of playing.
         * @param playTimes - Playing repeat times. [-1: Use the default value of animation data, 0: No end loop playing, [1~N]: Repeat N times] (Default: -1)
         * @returns The played animation state.
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 从指定帧开始播放指定的动画。
         * @param animationName - 动画数据名称。
         * @param frame - 播放开始的帧数。
         * @param playTimes - 播放次数。 [-1: 使用动画数据默认值, 0: 无限循环播放, [1~N]: 循环播放 N 次] （默认: -1）
         * @returns 播放的动画状态。
         * @version DragonBones 4.5
         * @language zh_CN
         */
        gotoAndPlayByFrame(animationName, frame = 0, playTimes = -1) {
            this._animationConfig.clear();
            this._animationConfig.resetToPose = true;
            this._animationConfig.playTimes = playTimes;
            this._animationConfig.fadeInTime = 0.0;
            this._animationConfig.animation = animationName;
            const animationData = animationName in this._animations ? this._animations[animationName] : null;
            if (animationData !== null) {
                this._animationConfig.position = animationData.duration * frame / animationData.frameCount;
            }
            return this.playConfig(this._animationConfig);
        }
        /**
         * - Play a specific animation from the specific progress.
         * @param animationName - The name of animation data.
         * @param progress - The start progress value of playing.
         * @param playTimes - Playing repeat times. [-1: Use the default value of animation data, 0: No end loop playing, [1~N]: Repeat N times] (Default: -1)
         * @returns The played animation state.
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 从指定进度开始播放指定的动画。
         * @param animationName - 动画数据名称。
         * @param progress - 开始播放的进度。
         * @param playTimes - 播放次数。 [-1: 使用动画数据默认值, 0: 无限循环播放, [1~N]: 循环播放 N 次] （默认: -1）
         * @returns 播放的动画状态。
         * @version DragonBones 4.5
         * @language zh_CN
         */
        gotoAndPlayByProgress(animationName, progress = 0.0, playTimes = -1) {
            this._animationConfig.clear();
            this._animationConfig.resetToPose = true;
            this._animationConfig.playTimes = playTimes;
            this._animationConfig.fadeInTime = 0.0;
            this._animationConfig.animation = animationName;
            const animationData = animationName in this._animations ? this._animations[animationName] : null;
            if (animationData !== null) {
                this._animationConfig.position = animationData.duration * (progress > 0.0 ? progress : 0.0);
            }
            return this.playConfig(this._animationConfig);
        }
        /**
         * - Stop a specific animation at the specific time.
         * @param animationName - The name of animation data.
         * @param time - The stop time. (In seconds)
         * @returns The played animation state.
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 在指定时间停止指定动画播放
         * @param animationName - 动画数据名称。
         * @param time - 停止的时间。 (以秒为单位)
         * @returns 播放的动画状态。
         * @version DragonBones 4.5
         * @language zh_CN
         */
        gotoAndStopByTime(animationName, time = 0.0) {
            const animationState = this.gotoAndPlayByTime(animationName, time, 1);
            if (animationState !== null) {
                animationState.stop();
            }
            return animationState;
        }
        /**
         * - Stop a specific animation at the specific frame.
         * @param animationName - The name of animation data.
         * @param frame - The stop frame.
         * @returns The played animation state.
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 在指定帧停止指定动画的播放
         * @param animationName - 动画数据名称。
         * @param frame - 停止的帧数。
         * @returns 播放的动画状态。
         * @version DragonBones 4.5
         * @language zh_CN
         */
        gotoAndStopByFrame(animationName, frame = 0) {
            const animationState = this.gotoAndPlayByFrame(animationName, frame, 1);
            if (animationState !== null) {
                animationState.stop();
            }
            return animationState;
        }
        /**
         * - Stop a specific animation at the specific progress.
         * @param animationName - The name of animation data.
         * @param progress - The stop progress value.
         * @returns The played animation state.
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 在指定的进度停止指定的动画播放。
         * @param animationName - 动画数据名称。
         * @param progress - 停止进度。
         * @returns 播放的动画状态。
         * @version DragonBones 4.5
         * @language zh_CN
         */
        gotoAndStopByProgress(animationName, progress = 0.0) {
            const animationState = this.gotoAndPlayByProgress(animationName, progress, 1);
            if (animationState !== null) {
                animationState.stop();
            }
            return animationState;
        }
        /**
         * - Get a specific animation state.
         * @param animationName - The name of animation state.
         * @example
         * <pre>
         *     armature.animation.play("walk");
         *     let walkState = armature.animation.getState("walk");
         *     walkState.timeScale = 0.5;
         * </pre>
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 获取指定的动画状态
         * @param animationName - 动画状态名称。
         * @example
         * <pre>
         *     armature.animation.play("walk");
         *     let walkState = armature.animation.getState("walk");
         *     walkState.timeScale = 0.5;
         * </pre>
         * @version DragonBones 3.0
         * @language zh_CN
         */
        getState(animationName) {
            let i = this._animationStates.length;
            while (i--) {
                const animationState = this._animationStates[i];
                if (animationState.name === animationName) {
                    return animationState;
                }
            }
            return null;
        }
        /**
         * - Check whether a specific animation data is included.
         * @param animationName - The name of animation data.
         * @see dragonBones.AnimationData
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 检查是否包含指定的动画数据
         * @param animationName - 动画数据名称。
         * @see dragonBones.AnimationData
         * @version DragonBones 3.0
         * @language zh_CN
         */
        hasAnimation(animationName) {
            return animationName in this._animations;
        }
        /**
         * - Get all the animation states.
         * @version DragonBones 5.1
         * @language en_US
         */
        /**
         * - 获取所有的动画状态
         * @version DragonBones 5.1
         * @language zh_CN
         */
        getStates() {
            return this._animationStates;
        }
        /**
         * - Check whether there is an animation state is playing
         * @see dragonBones.AnimationState
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 检查是否有动画状态正在播放
         * @see dragonBones.AnimationState
         * @version DragonBones 3.0
         * @language zh_CN
         */
        get isPlaying() {
            for (const animationState of this._animationStates) {
                if (animationState.isPlaying) {
                    return true;
                }
            }
            return false;
        }
        /**
         * - Check whether all the animation states' playing were finished.
         * @see dragonBones.AnimationState
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 检查是否所有的动画状态均已播放完毕。
         * @see dragonBones.AnimationState
         * @version DragonBones 3.0
         * @language zh_CN
         */
        get isCompleted() {
            for (const animationState of this._animationStates) {
                if (!animationState.isCompleted) {
                    return false;
                }
            }
            return this._animationStates.length > 0;
        }
        /**
         * - The name of the last playing animation state.
         * @see #lastAnimationState
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 上一个播放的动画状态名称
         * @see #lastAnimationState
         * @version DragonBones 3.0
         * @language zh_CN
         */
        get lastAnimationName() {
            return this._lastAnimationState !== null ? this._lastAnimationState.name : "";
        }
        /**
         * - The name of all animation data
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 所有动画数据的名称
         * @version DragonBones 4.5
         * @language zh_CN
         */
        get animationNames() {
            return this._animationNames;
        }
        /**
         * - All animation data.
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 所有的动画数据。
         * @version DragonBones 4.5
         * @language zh_CN
         */
        get animations() {
            return this._animations;
        }
        set animations(value) {
            if (this._animations === value) {
                return;
            }
            this._animationNames.length = 0;
            for (let k in this._animations) {
                delete this._animations[k];
            }
            for (let k in value) {
                this._animationNames.push(k);
                this._animations[k] = value[k];
            }
        }
        /**
         * - An AnimationConfig instance that can be used quickly.
         * @see dragonBones.AnimationConfig
         * @version DragonBones 5.0
         * @language en_US
         */
        /**
         * - 一个可以快速使用的动画配置实例。
         * @see dragonBones.AnimationConfig
         * @version DragonBones 5.0
         * @language zh_CN
         */
        get animationConfig() {
            this._animationConfig.clear();
            return this._animationConfig;
        }
        /**
         * - The last playing animation state
         * @see dragonBones.AnimationState
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 上一个播放的动画状态
         * @see dragonBones.AnimationState
         * @version DragonBones 3.0
         * @language zh_CN
         */
        get lastAnimationState() {
            return this._lastAnimationState;
        }
        /**
         * - Deprecated, please refer to {@link #play()} {@link #fadeIn()}.
         * @deprecated
         * @language en_US
         */
        /**
         * - 已废弃，请参考 {@link #play()} {@link #fadeIn()}。
         * @deprecated
         * @language zh_CN
         */
        gotoAndPlay(animationName, fadeInTime = -1, duration = -1, playTimes = -1, layer = 0, group = null, fadeOutMode = 3 /* AnimationFadeOutMode.SameLayerAndGroup */, pauseFadeOut = true, pauseFadeIn = true) {
            // tslint:disable-next-line:no-unused-expression
            pauseFadeOut;
            // tslint:disable-next-line:no-unused-expression
            pauseFadeIn;
            this._animationConfig.clear();
            this._animationConfig.resetToPose = true;
            this._animationConfig.fadeOutMode = fadeOutMode;
            this._animationConfig.playTimes = playTimes;
            this._animationConfig.layer = layer;
            this._animationConfig.fadeInTime = fadeInTime;
            this._animationConfig.animation = animationName;
            this._animationConfig.group = group !== null ? group : "";
            const animationData = this._animations[animationName];
            if (animationData && duration > 0.0) {
                this._animationConfig.timeScale = animationData.duration / duration;
            }
            return this.playConfig(this._animationConfig);
        }
        /**
         * - Deprecated, please refer to {@link #gotoAndStopByTime()}.
         * @deprecated
         * @language en_US
         */
        /**
         * - 已废弃，请参考 {@link #gotoAndStopByTime()}。
         * @deprecated
         * @language zh_CN
         */
        gotoAndStop(animationName, time = 0) {
            return this.gotoAndStopByTime(animationName, time);
        }
        /**
         * - Deprecated, please refer to {@link #animationNames}.
         * @deprecated
         * @language en_US
         */
        /**
         * - 已废弃，请参考 {@link #animationNames}。
         * @deprecated
         * @language zh_CN
         */
        get animationList() {
            return this._animationNames;
        }
        /**
         * - Deprecated, please refer to {@link #animationNames}.
         * @deprecated
         * @language en_US
         */
        /**
         * - 已废弃，请参考 {@link #animationNames}。
         * @deprecated
         * @language zh_CN
         */
        get animationDataList() {
            const list = [];
            for (let i = 0, l = this._animationNames.length; i < l; ++i) {
                list.push(this._animations[this._animationNames[i]]);
            }
            return list;
        }
    }
    dragonBones.Animation = Animation;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * - Worldclock provides clock support for animations, advance time for each IAnimatable object added to the instance.
     * @see dragonBones.IAnimateble
     * @see dragonBones.Armature
     * @version DragonBones 3.0
     * @language en_US
     */
    /**
     * - WorldClock 对动画提供时钟支持，为每个加入到该实例的 IAnimatable 对象更新时间。
     * @see dragonBones.IAnimateble
     * @see dragonBones.Armature
     * @version DragonBones 3.0
     * @language zh_CN
     */
    class WorldClock {
        /**
         * - Creating a Worldclock instance. Typically, you do not need to create Worldclock instance.
         * When multiple Worldclock instances are running at different speeds, can achieving some specific animation effects, such as bullet time.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 创建一个 WorldClock 实例。通常并不需要创建 WorldClock 实例。
         * 当多个 WorldClock 实例使用不同的速度运行时，可以实现一些特殊的动画效果，比如子弹时间等。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        constructor(time = -1.0) {
            /**
             * - Current time. (In seconds)
             * @version DragonBones 3.0
             * @language en_US
             */
            /**
             * - 当前的时间。 (以秒为单位)
             * @version DragonBones 3.0
             * @language zh_CN
             */
            this.time = 0.0;
            /**
             * - The play speed, used to control animation speed-shift play.
             * [0: Stop play, (0~1): Slow play, 1: Normal play, (1~N): Fast play]
             * @default 1.0
             * @version DragonBones 3.0
             * @language en_US
             */
            /**
             * - 播放速度，用于控制动画变速播放。
             * [0: 停止播放, (0~1): 慢速播放, 1: 正常播放, (1~N): 快速播放]
             * @default 1.0
             * @version DragonBones 3.0
             * @language zh_CN
             */
            this.timeScale = 1.0;
            this._animatebles = [];
            this._clock = null;
            if (time < 0.0) {
                this.time = new Date().getTime() * 0.001;
            }
            else {
                this.time = time;
            }
        }
        /**
         * - Advance time for all IAnimatable instances.
         * @param passedTime - Passed time. [-1: Automatically calculates the time difference between the current frame and the previous frame, [0~N): Passed time] (In seconds)
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 为所有的 IAnimatable 实例更新时间。
         * @param passedTime - 前进的时间。 [-1: 自动计算当前帧与上一帧的时间差, [0~N): 前进的时间] (以秒为单位)
         * @version DragonBones 3.0
         * @language zh_CN
         */
        advanceTime(passedTime) {
            if (passedTime !== passedTime) { // isNaN
                passedTime = 0.0;
            }
            if (passedTime < 0.0) {
                passedTime = new Date().getTime() * 0.001 - this.time;
            }
            if (this.timeScale !== 1.0) {
                passedTime *= this.timeScale;
            }
            if (passedTime < 0.0) {
                this.time -= passedTime;
            }
            else {
                this.time += passedTime;
            }
            if (passedTime === 0.0) {
                return;
            }
            let i = 0, r = 0, l = this._animatebles.length;
            for (; i < l; ++i) {
                const animatable = this._animatebles[i];
                if (animatable !== null) {
                    if (r > 0) {
                        this._animatebles[i - r] = animatable;
                        this._animatebles[i] = null;
                    }
                    animatable.advanceTime(passedTime);
                }
                else {
                    r++;
                }
            }
            if (r > 0) {
                l = this._animatebles.length;
                for (; i < l; ++i) {
                    const animateble = this._animatebles[i];
                    if (animateble !== null) {
                        this._animatebles[i - r] = animateble;
                    }
                    else {
                        r++;
                    }
                }
                this._animatebles.length -= r;
            }
        }
        /**
         * - Check whether contains a specific instance of IAnimatable.
         * @param value - The IAnimatable instance.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 检查是否包含特定的 IAnimatable 实例。
         * @param value - IAnimatable 实例。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        contains(value) {
            if (value === this) {
                return false;
            }
            let ancestor = value;
            while (ancestor !== this && ancestor !== null) {
                ancestor = ancestor.clock;
            }
            return ancestor === this;
        }
        /**
         * - Add IAnimatable instance.
         * @param value - The IAnimatable instance.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 添加 IAnimatable 实例。
         * @param value - IAnimatable 实例。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        add(value) {
            if (this._animatebles.indexOf(value) < 0) {
                this._animatebles.push(value);
                value.clock = this;
            }
        }
        /**
         * - Removes a specified IAnimatable instance.
         * @param value - The IAnimatable instance.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 移除特定的 IAnimatable 实例。
         * @param value - IAnimatable 实例。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        remove(value) {
            const index = this._animatebles.indexOf(value);
            if (index >= 0) {
                this._animatebles[index] = null;
                value.clock = null;
            }
        }
        /**
         * - Clear all IAnimatable instances.
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 清除所有的 IAnimatable 实例。
         * @version DragonBones 3.0
         * @language zh_CN
         */
        clear() {
            for (const animatable of this._animatebles) {
                if (animatable !== null) {
                    animatable.clock = null;
                }
            }
        }
        /**
         * @inheritDoc
         */
        get clock() {
            return this._clock;
        }
        set clock(value) {
            if (this._clock === value) {
                return;
            }
            if (this._clock !== null) {
                this._clock.remove(this);
            }
            this._clock = value;
            if (this._clock !== null) {
                this._clock.add(this);
            }
        }
    }
    /**
     * - Deprecated, please refer to {@link dragonBones.BaseFactory#clock}.
     * @deprecated
     * @language en_US
     */
    /**
     * - 已废弃，请参考 {@link dragonBones.BaseFactory#clock}。
     * @deprecated
     * @language zh_CN
     */
    WorldClock.clock = new WorldClock();
    dragonBones.WorldClock = WorldClock;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * @internal
     * @private
     */
    class DataParser {
        static _getArmatureType(value) {
            switch (value.toLowerCase()) {
                case "stage":
                    return 2 /* ArmatureType.Stage */;
                case "armature":
                    return 0 /* ArmatureType.Armature */;
                case "movieclip":
                    return 1 /* ArmatureType.MovieClip */;
                default:
                    return 0 /* ArmatureType.Armature */;
            }
        }
        static _getBoneType(value) {
            switch (value.toLowerCase()) {
                case "bone":
                    return 0 /* BoneType.Bone */;
                case "surface":
                    return 1 /* BoneType.Surface */;
                default:
                    return 0 /* BoneType.Bone */;
            }
        }
        static _getDisplayType(value) {
            switch (value.toLowerCase()) {
                case "image":
                    return 0 /* DisplayType.Image */;
                case "mesh":
                    return 2 /* DisplayType.Mesh */;
                case "armature":
                    return 1 /* DisplayType.Armature */;
                case "boundingbox":
                    return 3 /* DisplayType.BoundingBox */;
                default:
                    return 0 /* DisplayType.Image */;
            }
        }
        static _getBoundingBoxType(value) {
            switch (value.toLowerCase()) {
                case "rectangle":
                    return 0 /* BoundingBoxType.Rectangle */;
                case "ellipse":
                    return 1 /* BoundingBoxType.Ellipse */;
                case "polygon":
                    return 2 /* BoundingBoxType.Polygon */;
                default:
                    return 0 /* BoundingBoxType.Rectangle */;
            }
        }
        static _getActionType(value) {
            switch (value.toLowerCase()) {
                case "play":
                    return 0 /* ActionType.Play */;
                case "frame":
                    return 10 /* ActionType.Frame */;
                case "sound":
                    return 11 /* ActionType.Sound */;
                default:
                    return 0 /* ActionType.Play */;
            }
        }
        static _getBlendMode(value) {
            switch (value.toLowerCase()) {
                case "normal":
                    return 0 /* BlendMode.Normal */;
                case "add":
                    return 1 /* BlendMode.Add */;
                case "alpha":
                    return 2 /* BlendMode.Alpha */;
                case "darken":
                    return 3 /* BlendMode.Darken */;
                case "difference":
                    return 4 /* BlendMode.Difference */;
                case "erase":
                    return 5 /* BlendMode.Erase */;
                case "hardlight":
                    return 6 /* BlendMode.HardLight */;
                case "invert":
                    return 7 /* BlendMode.Invert */;
                case "layer":
                    return 8 /* BlendMode.Layer */;
                case "lighten":
                    return 9 /* BlendMode.Lighten */;
                case "multiply":
                    return 10 /* BlendMode.Multiply */;
                case "overlay":
                    return 11 /* BlendMode.Overlay */;
                case "screen":
                    return 12 /* BlendMode.Screen */;
                case "subtract":
                    return 13 /* BlendMode.Subtract */;
                default:
                    return 0 /* BlendMode.Normal */;
            }
        }
        /**
         * - Deprecated, please refer to {@link dragonBones.BaseFactory#parsetTextureAtlasData()}.
         * @deprecated
         * @language en_US
         */
        /**
         * - 已废弃，请参考 {@link dragonBones.BaseFactory#parsetTextureAtlasData()}。
         * @deprecated
         * @language zh_CN
         */
        static parseDragonBonesData(rawData) {
            if (rawData instanceof ArrayBuffer) {
                return dragonBones.BinaryDataParser.getInstance().parseDragonBonesData(rawData);
            }
            else {
                return dragonBones.ObjectDataParser.getInstance().parseDragonBonesData(rawData);
            }
        }
        /**
         * - Deprecated, please refer to {@link dragonBones.BaseFactory#parsetTextureAtlasData()}.
         * @deprecated
         * @language en_US
         */
        /**
         * - 已废弃，请参考 {@link dragonBones.BaseFactory#parsetTextureAtlasData()}。
         * @deprecated
         * @language zh_CN
         */
        static parseTextureAtlasData(rawData, scale = 1) {
            console.warn("已废弃");
            const textureAtlasData = {};
            const subTextureList = rawData[DataParser.SUB_TEXTURE];
            for (let i = 0, len = subTextureList.length; i < len; i++) {
                const subTextureObject = subTextureList[i];
                const subTextureName = subTextureObject[DataParser.NAME];
                const subTextureRegion = new dragonBones.Rectangle();
                let subTextureFrame = null;
                subTextureRegion.x = subTextureObject[DataParser.X] / scale;
                subTextureRegion.y = subTextureObject[DataParser.Y] / scale;
                subTextureRegion.width = subTextureObject[DataParser.WIDTH] / scale;
                subTextureRegion.height = subTextureObject[DataParser.HEIGHT] / scale;
                if (DataParser.FRAME_WIDTH in subTextureObject) {
                    subTextureFrame = new dragonBones.Rectangle();
                    subTextureFrame.x = subTextureObject[DataParser.FRAME_X] / scale;
                    subTextureFrame.y = subTextureObject[DataParser.FRAME_Y] / scale;
                    subTextureFrame.width = subTextureObject[DataParser.FRAME_WIDTH] / scale;
                    subTextureFrame.height = subTextureObject[DataParser.FRAME_HEIGHT] / scale;
                }
                textureAtlasData[subTextureName] = { region: subTextureRegion, frame: subTextureFrame, rotated: false };
            }
            return textureAtlasData;
        }
    }
    DataParser.DATA_VERSION_2_3 = "2.3";
    DataParser.DATA_VERSION_3_0 = "3.0";
    DataParser.DATA_VERSION_4_0 = "4.0";
    DataParser.DATA_VERSION_4_5 = "4.5";
    DataParser.DATA_VERSION_5_0 = "5.0";
    DataParser.DATA_VERSION_5_5 = "5.5";
    DataParser.DATA_VERSION = DataParser.DATA_VERSION_5_5;
    DataParser.DATA_VERSIONS = [
        DataParser.DATA_VERSION_4_0,
        DataParser.DATA_VERSION_4_5,
        DataParser.DATA_VERSION_5_0,
        DataParser.DATA_VERSION_5_5
    ];
    DataParser.TEXTURE_ATLAS = "textureAtlas";
    DataParser.SUB_TEXTURE = "SubTexture";
    DataParser.FORMAT = "format";
    DataParser.IMAGE_PATH = "imagePath";
    DataParser.WIDTH = "width";
    DataParser.HEIGHT = "height";
    DataParser.ROTATED = "rotated";
    DataParser.FRAME_X = "frameX";
    DataParser.FRAME_Y = "frameY";
    DataParser.FRAME_WIDTH = "frameWidth";
    DataParser.FRAME_HEIGHT = "frameHeight";
    DataParser.DRADON_BONES = "dragonBones";
    DataParser.USER_DATA = "userData";
    DataParser.ARMATURE = "armature";
    DataParser.BONE = "bone";
    DataParser.SURFACE = "surface";
    DataParser.SLOT = "slot";
    DataParser.CONSTRAINT = "constraint";
    DataParser.IK = "ik";
    DataParser.SKIN = "skin";
    DataParser.DISPLAY = "display";
    DataParser.ANIMATION = "animation";
    DataParser.Z_ORDER = "zOrder";
    DataParser.FFD = "ffd";
    DataParser.FRAME = "frame";
    DataParser.TRANSLATE_FRAME = "translateFrame";
    DataParser.ROTATE_FRAME = "rotateFrame";
    DataParser.SCALE_FRAME = "scaleFrame";
    DataParser.DISPLAY_FRAME = "displayFrame";
    DataParser.COLOR_FRAME = "colorFrame";
    DataParser.DEFAULT_ACTIONS = "defaultActions";
    DataParser.ACTIONS = "actions";
    DataParser.EVENTS = "events";
    DataParser.INTS = "ints";
    DataParser.FLOATS = "floats";
    DataParser.STRINGS = "strings";
    DataParser.CANVAS = "canvas";
    DataParser.TRANSFORM = "transform";
    DataParser.PIVOT = "pivot";
    DataParser.AABB = "aabb";
    DataParser.COLOR = "color";
    DataParser.VERSION = "version";
    DataParser.COMPATIBLE_VERSION = "compatibleVersion";
    DataParser.FRAME_RATE = "frameRate";
    DataParser.TYPE = "type";
    DataParser.SUB_TYPE = "subType";
    DataParser.NAME = "name";
    DataParser.PARENT = "parent";
    DataParser.TARGET = "target";
    DataParser.STAGE = "stage";
    DataParser.SHARE = "share";
    DataParser.PATH = "path";
    DataParser.LENGTH = "length";
    DataParser.DISPLAY_INDEX = "displayIndex";
    DataParser.BLEND_MODE = "blendMode";
    DataParser.INHERIT_TRANSLATION = "inheritTranslation";
    DataParser.INHERIT_ROTATION = "inheritRotation";
    DataParser.INHERIT_SCALE = "inheritScale";
    DataParser.INHERIT_REFLECTION = "inheritReflection";
    DataParser.INHERIT_ANIMATION = "inheritAnimation";
    DataParser.INHERIT_DEFORM = "inheritDeform";
    DataParser.SEGMENT_X = "segmentX";
    DataParser.SEGMENT_Y = "segmentY";
    DataParser.BEND_POSITIVE = "bendPositive";
    DataParser.CHAIN = "chain";
    DataParser.WEIGHT = "weight";
    DataParser.FADE_IN_TIME = "fadeInTime";
    DataParser.PLAY_TIMES = "playTimes";
    DataParser.SCALE = "scale";
    DataParser.OFFSET = "offset";
    DataParser.POSITION = "position";
    DataParser.DURATION = "duration";
    DataParser.TWEEN_EASING = "tweenEasing";
    DataParser.TWEEN_ROTATE = "tweenRotate";
    DataParser.TWEEN_SCALE = "tweenScale";
    DataParser.CLOCK_WISE = "clockwise";
    DataParser.CURVE = "curve";
    DataParser.SOUND = "sound";
    DataParser.EVENT = "event";
    DataParser.ACTION = "action";
    DataParser.X = "x";
    DataParser.Y = "y";
    DataParser.SKEW_X = "skX";
    DataParser.SKEW_Y = "skY";
    DataParser.SCALE_X = "scX";
    DataParser.SCALE_Y = "scY";
    DataParser.VALUE = "value";
    DataParser.ROTATE = "rotate";
    DataParser.SKEW = "skew";
    DataParser.ALPHA_OFFSET = "aO";
    DataParser.RED_OFFSET = "rO";
    DataParser.GREEN_OFFSET = "gO";
    DataParser.BLUE_OFFSET = "bO";
    DataParser.ALPHA_MULTIPLIER = "aM";
    DataParser.RED_MULTIPLIER = "rM";
    DataParser.GREEN_MULTIPLIER = "gM";
    DataParser.BLUE_MULTIPLIER = "bM";
    DataParser.UVS = "uvs";
    DataParser.VERTICES = "vertices";
    DataParser.TRIANGLES = "triangles";
    DataParser.WEIGHTS = "weights";
    DataParser.SLOT_POSE = "slotPose";
    DataParser.BONE_POSE = "bonePose";
    DataParser.GLUE_WEIGHTS = "glueWeights";
    DataParser.GLUE_MESHES = "glueMeshes";
    DataParser.GOTO_AND_PLAY = "gotoAndPlay";
    DataParser.DEFAULT_NAME = "default";
    dragonBones.DataParser = DataParser;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * @internal
     * @private
     */
    class ObjectDataParser extends dragonBones.DataParser {
        constructor() {
            super(...arguments);
            this._rawTextureAtlasIndex = 0;
            this._rawBones = [];
            this._data = null; //
            this._armature = null; //
            this._bone = null; //
            this._surface = null; //
            this._slot = null; //
            this._skin = null; //
            this._mesh = null; //
            this._animation = null; //
            this._timeline = null; //
            this._rawTextureAtlases = null;
            this._defaultColorOffset = -1;
            this._prevClockwise = 0;
            this._prevRotation = 0.0;
            this._helpMatrixA = new dragonBones.Matrix();
            this._helpMatrixB = new dragonBones.Matrix();
            this._helpTransform = new dragonBones.Transform();
            this._helpColorTransform = new dragonBones.ColorTransform();
            this._helpPoint = new dragonBones.Point();
            this._helpArray = [];
            this._intArray = [];
            this._floatArray = [];
            this._frameIntArray = [];
            this._frameFloatArray = [];
            this._frameArray = [];
            this._timelineArray = [];
            this._cacheRawMeshes = [];
            this._cacheMeshes = [];
            this._actionFrames = [];
            this._weightSlotPose = {};
            this._weightBonePoses = {};
            this._cacheBones = {};
            this._slotChildActions = {};
        }
        static _getBoolean(rawData, key, defaultValue) {
            if (key in rawData) {
                const value = rawData[key];
                const type = typeof value;
                if (type === "boolean") {
                    return value;
                }
                else if (type === "string") {
                    switch (value) {
                        case "0":
                        case "NaN":
                        case "":
                        case "false":
                        case "null":
                        case "undefined":
                            return false;
                        default:
                            return true;
                    }
                }
                else {
                    return !!value;
                }
            }
            return defaultValue;
        }
        static _getNumber(rawData, key, defaultValue) {
            if (key in rawData) {
                const value = rawData[key];
                if (value === null || value === "NaN") {
                    return defaultValue;
                }
                return +value || 0;
            }
            return defaultValue;
        }
        static _getString(rawData, key, defaultValue) {
            if (key in rawData) {
                const value = rawData[key];
                const type = typeof value;
                if (type === "string") {
                    if (dragonBones.DragonBones.webAssembly) {
                        for (let i = 0, l = value.length; i < l; ++i) {
                            if (value.charCodeAt(i) > 255) {
                                return encodeURI(value);
                            }
                        }
                    }
                    return value;
                }
                return String(value);
            }
            return defaultValue;
        }
        _getCurvePoint(x1, y1, x2, y2, x3, y3, x4, y4, t, result) {
            const l_t = 1.0 - t;
            const powA = l_t * l_t;
            const powB = t * t;
            const kA = l_t * powA;
            const kB = 3.0 * t * powA;
            const kC = 3.0 * l_t * powB;
            const kD = t * powB;
            result.x = kA * x1 + kB * x2 + kC * x3 + kD * x4;
            result.y = kA * y1 + kB * y2 + kC * y3 + kD * y4;
        }
        _samplingEasingCurve(curve, samples) {
            const curveCount = curve.length;
            let stepIndex = -2;
            for (let i = 0, l = samples.length; i < l; ++i) {
                let t = (i + 1) / (l + 1); // float
                while ((stepIndex + 6 < curveCount ? curve[stepIndex + 6] : 1) < t) { // stepIndex + 3 * 2
                    stepIndex += 6;
                }
                const isInCurve = stepIndex >= 0 && stepIndex + 6 < curveCount;
                const x1 = isInCurve ? curve[stepIndex] : 0.0;
                const y1 = isInCurve ? curve[stepIndex + 1] : 0.0;
                const x2 = curve[stepIndex + 2];
                const y2 = curve[stepIndex + 3];
                const x3 = curve[stepIndex + 4];
                const y3 = curve[stepIndex + 5];
                const x4 = isInCurve ? curve[stepIndex + 6] : 1.0;
                const y4 = isInCurve ? curve[stepIndex + 7] : 1.0;
                let lower = 0.0;
                let higher = 1.0;
                while (higher - lower > 0.0001) {
                    const percentage = (higher + lower) * 0.5;
                    this._getCurvePoint(x1, y1, x2, y2, x3, y3, x4, y4, percentage, this._helpPoint);
                    if (t - this._helpPoint.x > 0.0) {
                        lower = percentage;
                    }
                    else {
                        higher = percentage;
                    }
                }
                samples[i] = this._helpPoint.y;
            }
        }
        _parseActionDataInFrame(rawData, frameStart, bone, slot) {
            if (dragonBones.DataParser.EVENT in rawData) {
                this._mergeActionFrame(rawData[dragonBones.DataParser.EVENT], frameStart, 10 /* ActionType.Frame */, bone, slot);
            }
            if (dragonBones.DataParser.SOUND in rawData) {
                this._mergeActionFrame(rawData[dragonBones.DataParser.SOUND], frameStart, 11 /* ActionType.Sound */, bone, slot);
            }
            if (dragonBones.DataParser.ACTION in rawData) {
                this._mergeActionFrame(rawData[dragonBones.DataParser.ACTION], frameStart, 0 /* ActionType.Play */, bone, slot);
            }
            if (dragonBones.DataParser.EVENTS in rawData) {
                this._mergeActionFrame(rawData[dragonBones.DataParser.EVENTS], frameStart, 10 /* ActionType.Frame */, bone, slot);
            }
            if (dragonBones.DataParser.ACTIONS in rawData) {
                this._mergeActionFrame(rawData[dragonBones.DataParser.ACTIONS], frameStart, 0 /* ActionType.Play */, bone, slot);
            }
        }
        _mergeActionFrame(rawData, frameStart, type, bone, slot) {
            const actionOffset = dragonBones.DragonBones.webAssembly ? this._armature.actions.size() : this._armature.actions.length;
            const actions = this._parseActionData(rawData, type, bone, slot);
            let frameIndex = 0;
            let frame = null;
            for (const action of actions) {
                this._armature.addAction(action, false);
            }
            if (this._actionFrames.length === 0) { // First frame.
                frame = new ActionFrame();
                frame.frameStart = 0;
                this._actionFrames.push(frame);
                frame = null;
            }
            for (const eachFrame of this._actionFrames) { // Get same frame.
                if (eachFrame.frameStart === frameStart) {
                    frame = eachFrame;
                    break;
                }
                else if (eachFrame.frameStart > frameStart) {
                    break;
                }
                frameIndex++;
            }
            if (frame === null) { // Create and cache frame.
                frame = new ActionFrame();
                frame.frameStart = frameStart;
                this._actionFrames.splice(frameIndex + 1, 0, frame);
            }
            for (let i = 0; i < actions.length; ++i) { // Cache action offsets.
                frame.actions.push(actionOffset + i);
            }
        }
        _parseArmature(rawData, scale) {
            const armature = dragonBones.BaseObject.borrowObject(dragonBones.ArmatureData);
            armature.name = ObjectDataParser._getString(rawData, dragonBones.DataParser.NAME, "");
            armature.frameRate = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.FRAME_RATE, this._data.frameRate);
            armature.scale = scale;
            if (dragonBones.DataParser.TYPE in rawData && typeof rawData[dragonBones.DataParser.TYPE] === "string") {
                armature.type = dragonBones.DataParser._getArmatureType(rawData[dragonBones.DataParser.TYPE]);
            }
            else {
                armature.type = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.TYPE, 0 /* ArmatureType.Armature */);
            }
            if (armature.frameRate === 0) { // Data error.
                armature.frameRate = 24;
            }
            this._armature = armature;
            if (dragonBones.DataParser.CANVAS in rawData) {
                const rawCanvas = rawData[dragonBones.DataParser.CANVAS];
                const canvas = dragonBones.BaseObject.borrowObject(dragonBones.CanvasData);
                if (dragonBones.DataParser.COLOR in rawCanvas) {
                    canvas.hasBackground = true;
                }
                else {
                    canvas.hasBackground = false;
                }
                canvas.color = ObjectDataParser._getNumber(rawCanvas, dragonBones.DataParser.COLOR, 0);
                canvas.x = ObjectDataParser._getNumber(rawCanvas, dragonBones.DataParser.X, 0) * armature.scale;
                canvas.y = ObjectDataParser._getNumber(rawCanvas, dragonBones.DataParser.Y, 0) * armature.scale;
                canvas.width = ObjectDataParser._getNumber(rawCanvas, dragonBones.DataParser.WIDTH, 0) * armature.scale;
                canvas.height = ObjectDataParser._getNumber(rawCanvas, dragonBones.DataParser.HEIGHT, 0) * armature.scale;
                armature.canvas = canvas;
            }
            if (dragonBones.DataParser.AABB in rawData) {
                const rawAABB = rawData[dragonBones.DataParser.AABB];
                armature.aabb.x = ObjectDataParser._getNumber(rawAABB, dragonBones.DataParser.X, 0.0) * armature.scale;
                armature.aabb.y = ObjectDataParser._getNumber(rawAABB, dragonBones.DataParser.Y, 0.0) * armature.scale;
                armature.aabb.width = ObjectDataParser._getNumber(rawAABB, dragonBones.DataParser.WIDTH, 0.0) * armature.scale;
                armature.aabb.height = ObjectDataParser._getNumber(rawAABB, dragonBones.DataParser.HEIGHT, 0.0) * armature.scale;
            }
            if (dragonBones.DataParser.BONE in rawData) {
                const rawBones = rawData[dragonBones.DataParser.BONE];
                for (const rawBone of rawBones) {
                    const parentName = ObjectDataParser._getString(rawBone, dragonBones.DataParser.PARENT, "");
                    const bone = this._parseBone(rawBone);
                    if (parentName.length > 0) { // Get bone parent.
                        const parent = armature.getBone(parentName);
                        if (parent !== null) {
                            bone.parent = parent;
                        }
                        else { // Cache.
                            if (!(parentName in this._cacheBones)) {
                                this._cacheBones[parentName] = [];
                            }
                            this._cacheBones[parentName].push(bone);
                        }
                    }
                    if (bone.name in this._cacheBones) {
                        for (const child of this._cacheBones[bone.name]) {
                            child.parent = bone;
                        }
                        delete this._cacheBones[bone.name];
                    }
                    armature.addBone(bone);
                    this._rawBones.push(bone); // Cache raw bones sort.
                }
            }
            if (dragonBones.DataParser.IK in rawData) {
                const rawIKS = rawData[dragonBones.DataParser.IK];
                for (const rawIK of rawIKS) {
                    const constraint = this._parseIKConstraint(rawIK);
                    if (constraint) {
                        armature.addConstraint(constraint);
                    }
                }
            }
            armature.sortBones();
            if (dragonBones.DataParser.SLOT in rawData) {
                let zOrder = 0;
                const rawSlots = rawData[dragonBones.DataParser.SLOT];
                for (const rawSlot of rawSlots) {
                    armature.addSlot(this._parseSlot(rawSlot, zOrder++));
                }
            }
            if (dragonBones.DataParser.SKIN in rawData) {
                const rawSkins = rawData[dragonBones.DataParser.SKIN];
                for (const rawSkin of rawSkins) {
                    armature.addSkin(this._parseSkin(rawSkin));
                }
            }
            for (let i = 0, l = this._cacheRawMeshes.length; i < l; ++i) { // Link glue mesh.
                const rawData = this._cacheRawMeshes[i];
                if (!(dragonBones.DataParser.GLUE_WEIGHTS in rawData) || !(dragonBones.DataParser.GLUE_MESHES in rawData)) {
                    continue;
                }
                this._parseMeshGlue(rawData, this._cacheMeshes[i]);
            }
            for (let i = 0, l = this._cacheRawMeshes.length; i < l; ++i) { // Link mesh.
                const rawData = this._cacheRawMeshes[i];
                const shareName = ObjectDataParser._getString(rawData, dragonBones.DataParser.SHARE, "");
                if (shareName.length === 0) {
                    continue;
                }
                let skinName = ObjectDataParser._getString(rawData, dragonBones.DataParser.SKIN, dragonBones.DataParser.DEFAULT_NAME);
                if (skinName.length === 0) { // 
                    skinName = dragonBones.DataParser.DEFAULT_NAME;
                }
                const shareMesh = armature.getMesh(skinName, "", shareName); // TODO slot;
                if (shareMesh === null) {
                    continue; // Error.
                }
                const mesh = this._cacheMeshes[i];
                mesh.offset = shareMesh.offset;
                mesh.weight = shareMesh.weight;
                mesh.glue = shareMesh.glue;
            }
            if (dragonBones.DataParser.ANIMATION in rawData) {
                const rawAnimations = rawData[dragonBones.DataParser.ANIMATION];
                for (const rawAnimation of rawAnimations) {
                    const animation = this._parseAnimation(rawAnimation);
                    armature.addAnimation(animation);
                }
            }
            if (dragonBones.DataParser.DEFAULT_ACTIONS in rawData) {
                const actions = this._parseActionData(rawData[dragonBones.DataParser.DEFAULT_ACTIONS], 0 /* ActionType.Play */, null, null);
                for (const action of actions) {
                    armature.addAction(action, true);
                    if (action.type === 0 /* ActionType.Play */) { // Set default animation from default action.
                        const animation = armature.getAnimation(action.name);
                        if (animation !== null) {
                            armature.defaultAnimation = animation;
                        }
                    }
                }
            }
            if (dragonBones.DataParser.ACTIONS in rawData) {
                const actions = this._parseActionData(rawData[dragonBones.DataParser.ACTIONS], 0 /* ActionType.Play */, null, null);
                for (const action of actions) {
                    armature.addAction(action, false);
                }
            }
            // Clear helper.
            this._rawBones.length = 0;
            this._cacheRawMeshes.length = 0;
            this._cacheMeshes.length = 0;
            this._armature = null;
            for (let k in this._weightSlotPose) {
                delete this._weightSlotPose[k];
            }
            for (let k in this._weightBonePoses) {
                delete this._weightBonePoses[k];
            }
            for (let k in this._cacheBones) {
                delete this._cacheBones[k];
            }
            for (let k in this._slotChildActions) {
                delete this._slotChildActions[k];
            }
            return armature;
        }
        _parseBone(rawData) {
            let type = 0 /* BoneType.Bone */;
            const scale = this._armature.scale;
            if (dragonBones.DataParser.TYPE in rawData && typeof rawData[dragonBones.DataParser.TYPE] === "string") {
                type = dragonBones.DataParser._getBoneType(rawData[dragonBones.DataParser.TYPE]);
            }
            else {
                type = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.TYPE, 0 /* BoneType.Bone */);
            }
            if (type === 0 /* BoneType.Bone */) {
                const bone = dragonBones.BaseObject.borrowObject(dragonBones.BoneData);
                bone.inheritTranslation = ObjectDataParser._getBoolean(rawData, dragonBones.DataParser.INHERIT_TRANSLATION, true);
                bone.inheritRotation = ObjectDataParser._getBoolean(rawData, dragonBones.DataParser.INHERIT_ROTATION, true);
                bone.inheritScale = ObjectDataParser._getBoolean(rawData, dragonBones.DataParser.INHERIT_SCALE, true);
                bone.inheritReflection = ObjectDataParser._getBoolean(rawData, dragonBones.DataParser.INHERIT_REFLECTION, true);
                bone.length = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.LENGTH, 0) * scale;
                bone.name = ObjectDataParser._getString(rawData, dragonBones.DataParser.NAME, "");
                if (dragonBones.DataParser.TRANSFORM in rawData) {
                    this._parseTransform(rawData[dragonBones.DataParser.TRANSFORM], bone.transform, scale);
                }
                return bone;
            }
            const surface = dragonBones.BaseObject.borrowObject(dragonBones.SurfaceData);
            surface.name = ObjectDataParser._getString(rawData, dragonBones.DataParser.NAME, "");
            surface.segmentX = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.SEGMENT_X, 0);
            surface.segmentY = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.SEGMENT_Y, 0);
            surface.vertices.length = (surface.segmentX + 1) * (surface.segmentY + 1) * 2;
            if (dragonBones.DataParser.VERTICES in rawData) {
                const rawVertices = rawData[dragonBones.DataParser.VERTICES];
                for (let i = 0, l = surface.vertices.length; i < l; ++i) {
                    if (i < rawVertices.length) {
                        surface.vertices[i] = rawVertices[i] * scale;
                    }
                    else {
                        surface.vertices[i] = 0.0;
                    }
                }
            }
            return surface;
        }
        _parseIKConstraint(rawData) {
            const bone = this._armature.getBone(ObjectDataParser._getString(rawData, dragonBones.DataParser.BONE, ""));
            if (bone === null) {
                return null;
            }
            const target = this._armature.getBone(ObjectDataParser._getString(rawData, dragonBones.DataParser.TARGET, ""));
            if (target === null) {
                return null;
            }
            const constraint = dragonBones.BaseObject.borrowObject(dragonBones.IKConstraintData);
            constraint.scaleEnabled = ObjectDataParser._getBoolean(rawData, dragonBones.DataParser.SCALE, false);
            constraint.bendPositive = ObjectDataParser._getBoolean(rawData, dragonBones.DataParser.BEND_POSITIVE, true);
            constraint.weight = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.WEIGHT, 1.0);
            constraint.name = ObjectDataParser._getString(rawData, dragonBones.DataParser.NAME, "");
            constraint.target = target;
            const chain = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.CHAIN, 0);
            if (chain > 0 && bone.parent !== null) {
                constraint.root = bone.parent;
                constraint.bone = bone;
            }
            else {
                constraint.root = bone;
                constraint.bone = null;
            }
            return constraint;
        }
        _parseSlot(rawData, zOrder) {
            const slot = dragonBones.BaseObject.borrowObject(dragonBones.SlotData);
            slot.displayIndex = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.DISPLAY_INDEX, 0);
            slot.zOrder = zOrder;
            slot.name = ObjectDataParser._getString(rawData, dragonBones.DataParser.NAME, "");
            slot.parent = this._armature.getBone(ObjectDataParser._getString(rawData, dragonBones.DataParser.PARENT, "")); //
            if (dragonBones.DataParser.BLEND_MODE in rawData && typeof rawData[dragonBones.DataParser.BLEND_MODE] === "string") {
                slot.blendMode = dragonBones.DataParser._getBlendMode(rawData[dragonBones.DataParser.BLEND_MODE]);
            }
            else {
                slot.blendMode = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.BLEND_MODE, 0 /* BlendMode.Normal */);
            }
            if (dragonBones.DataParser.COLOR in rawData) {
                slot.color = dragonBones.SlotData.createColor();
                this._parseColorTransform(rawData[dragonBones.DataParser.COLOR], slot.color);
            }
            else {
                slot.color = dragonBones.SlotData.DEFAULT_COLOR;
            }
            if (dragonBones.DataParser.ACTIONS in rawData) {
                this._slotChildActions[slot.name] = this._parseActionData(rawData[dragonBones.DataParser.ACTIONS], 0 /* ActionType.Play */, null, null);
            }
            return slot;
        }
        _parseSkin(rawData) {
            const skin = dragonBones.BaseObject.borrowObject(dragonBones.SkinData);
            skin.name = ObjectDataParser._getString(rawData, dragonBones.DataParser.NAME, dragonBones.DataParser.DEFAULT_NAME);
            if (skin.name.length === 0) {
                skin.name = dragonBones.DataParser.DEFAULT_NAME;
            }
            if (dragonBones.DataParser.SLOT in rawData) {
                const rawSlots = rawData[dragonBones.DataParser.SLOT];
                this._skin = skin;
                for (const rawSlot of rawSlots) {
                    const slotName = ObjectDataParser._getString(rawSlot, dragonBones.DataParser.NAME, "");
                    const slot = this._armature.getSlot(slotName);
                    if (slot !== null) {
                        this._slot = slot;
                        if (dragonBones.DataParser.DISPLAY in rawSlot) {
                            const rawDisplays = rawSlot[dragonBones.DataParser.DISPLAY];
                            for (const rawDisplay of rawDisplays) {
                                if (rawDisplay) {
                                    skin.addDisplay(slotName, this._parseDisplay(rawDisplay));
                                }
                                else {
                                    skin.addDisplay(slotName, null);
                                }
                            }
                        }
                        this._slot = null; //
                    }
                }
                this._skin = null; //
            }
            return skin;
        }
        _parseDisplay(rawData) {
            const name = ObjectDataParser._getString(rawData, dragonBones.DataParser.NAME, "");
            const path = ObjectDataParser._getString(rawData, dragonBones.DataParser.PATH, "");
            let type = 0 /* DisplayType.Image */;
            let display = null;
            if (dragonBones.DataParser.TYPE in rawData && typeof rawData[dragonBones.DataParser.TYPE] === "string") {
                type = dragonBones.DataParser._getDisplayType(rawData[dragonBones.DataParser.TYPE]);
            }
            else {
                type = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.TYPE, type);
            }
            switch (type) {
                case 0 /* DisplayType.Image */:
                    const imageDisplay = display = dragonBones.BaseObject.borrowObject(dragonBones.ImageDisplayData);
                    imageDisplay.name = name;
                    imageDisplay.path = path.length > 0 ? path : name;
                    this._parsePivot(rawData, imageDisplay);
                    break;
                case 1 /* DisplayType.Armature */:
                    const armatureDisplay = display = dragonBones.BaseObject.borrowObject(dragonBones.ArmatureDisplayData);
                    armatureDisplay.name = name;
                    armatureDisplay.path = path.length > 0 ? path : name;
                    armatureDisplay.inheritAnimation = true;
                    if (dragonBones.DataParser.ACTIONS in rawData) {
                        const actions = this._parseActionData(rawData[dragonBones.DataParser.ACTIONS], 0 /* ActionType.Play */, null, null);
                        for (const action of actions) {
                            armatureDisplay.addAction(action);
                        }
                    }
                    else if (this._slot.name in this._slotChildActions) {
                        const displays = this._skin.getDisplays(this._slot.name);
                        if (displays === null ? this._slot.displayIndex === 0 : this._slot.displayIndex === displays.length) {
                            for (const action of this._slotChildActions[this._slot.name]) {
                                armatureDisplay.addAction(action);
                            }
                            delete this._slotChildActions[this._slot.name];
                        }
                    }
                    break;
                case 2 /* DisplayType.Mesh */:
                    const meshDisplay = display = dragonBones.BaseObject.borrowObject(dragonBones.MeshDisplayData);
                    meshDisplay.inheritDeform = ObjectDataParser._getBoolean(rawData, dragonBones.DataParser.INHERIT_DEFORM, true);
                    meshDisplay.name = name;
                    meshDisplay.path = path.length > 0 ? path : name;
                    if (dragonBones.DataParser.SHARE in rawData) {
                        this._cacheRawMeshes.push(rawData);
                        this._cacheMeshes.push(meshDisplay);
                    }
                    else {
                        this._parseMesh(rawData, meshDisplay);
                    }
                    if ((dragonBones.DataParser.GLUE_WEIGHTS in rawData) && (dragonBones.DataParser.GLUE_MESHES in rawData)) {
                        this._cacheRawMeshes.push(rawData);
                        this._cacheMeshes.push(meshDisplay);
                    }
                    break;
                case 3 /* DisplayType.BoundingBox */:
                    const boundingBox = this._parseBoundingBox(rawData);
                    if (boundingBox !== null) {
                        const boundingBoxDisplay = display = dragonBones.BaseObject.borrowObject(dragonBones.BoundingBoxDisplayData);
                        boundingBoxDisplay.name = name;
                        boundingBoxDisplay.path = path.length > 0 ? path : name;
                        boundingBoxDisplay.boundingBox = boundingBox;
                    }
                    break;
            }
            if (display !== null && dragonBones.DataParser.TRANSFORM in rawData) {
                this._parseTransform(rawData[dragonBones.DataParser.TRANSFORM], display.transform, this._armature.scale);
            }
            return display;
        }
        _parsePivot(rawData, display) {
            if (dragonBones.DataParser.PIVOT in rawData) {
                const rawPivot = rawData[dragonBones.DataParser.PIVOT];
                display.pivot.x = ObjectDataParser._getNumber(rawPivot, dragonBones.DataParser.X, 0.0);
                display.pivot.y = ObjectDataParser._getNumber(rawPivot, dragonBones.DataParser.Y, 0.0);
            }
            else {
                display.pivot.x = 0.5;
                display.pivot.y = 0.5;
            }
        }
        _parseMesh(rawData, mesh) {
            const rawVertices = rawData[dragonBones.DataParser.VERTICES];
            const rawUVs = rawData[dragonBones.DataParser.UVS];
            const rawTriangles = rawData[dragonBones.DataParser.TRIANGLES];
            const vertexCount = Math.floor(rawVertices.length / 2); // uint
            const triangleCount = Math.floor(rawTriangles.length / 3); // uint
            const vertexOffset = this._floatArray.length;
            const uvOffset = vertexOffset + vertexCount * 2;
            const meshOffset = this._intArray.length;
            const meshName = this._skin.name + "_" + this._slot.name + "_" + mesh.name; // Cache pose data.
            mesh.offset = meshOffset;
            this._intArray.length += 1 + 1 + 1 + 1 + triangleCount * 3;
            this._intArray[meshOffset + 0 /* BinaryOffset.MeshVertexCount */] = vertexCount;
            this._intArray[meshOffset + 1 /* BinaryOffset.MeshTriangleCount */] = triangleCount;
            this._intArray[meshOffset + 2 /* BinaryOffset.MeshFloatOffset */] = vertexOffset;
            for (let i = 0, l = triangleCount * 3; i < l; ++i) {
                this._intArray[meshOffset + 4 /* BinaryOffset.MeshVertexIndices */ + i] = rawTriangles[i];
            }
            this._floatArray.length += vertexCount * 2 + vertexCount * 2;
            for (let i = 0, l = vertexCount * 2; i < l; ++i) {
                this._floatArray[vertexOffset + i] = rawVertices[i];
                this._floatArray[uvOffset + i] = rawUVs[i];
            }
            if (dragonBones.DataParser.WEIGHTS in rawData) {
                const rawWeights = rawData[dragonBones.DataParser.WEIGHTS];
                const rawSlotPose = rawData[dragonBones.DataParser.SLOT_POSE];
                const rawBonePoses = rawData[dragonBones.DataParser.BONE_POSE];
                const sortedBones = this._armature.sortedBones;
                const weightBoneIndices = new Array();
                const weightBoneCount = Math.floor(rawBonePoses.length / 7); // uint
                const floatOffset = this._floatArray.length;
                const weightCount = Math.floor(rawWeights.length - vertexCount) / 2; // uint
                const weightOffset = this._intArray.length;
                const weight = dragonBones.BaseObject.borrowObject(dragonBones.WeightData);
                weight.count = weightCount;
                weight.offset = weightOffset;
                weightBoneIndices.length = weightBoneCount;
                this._intArray.length += 1 + 1 + weightBoneCount + vertexCount + weightCount;
                this._intArray[weightOffset + 1 /* BinaryOffset.WeigthFloatOffset */] = floatOffset;
                for (let i = 0; i < weightBoneCount; ++i) {
                    const rawBoneIndex = rawBonePoses[i * 7]; // uint
                    const bone = this._rawBones[rawBoneIndex];
                    weight.addBone(bone);
                    weightBoneIndices[i] = rawBoneIndex;
                    this._intArray[weightOffset + 2 /* BinaryOffset.WeigthBoneIndices */ + i] = sortedBones.indexOf(bone);
                }
                this._floatArray.length += weightCount * 3;
                this._helpMatrixA.copyFromArray(rawSlotPose, 0);
                for (let i = 0, iW = 0, iB = weightOffset + 2 /* BinaryOffset.WeigthBoneIndices */ + weightBoneCount, iV = floatOffset; i < vertexCount; ++i) {
                    const iD = i * 2;
                    const vertexBoneCount = this._intArray[iB++] = rawWeights[iW++]; // uint
                    let x = this._floatArray[vertexOffset + iD];
                    let y = this._floatArray[vertexOffset + iD + 1];
                    this._helpMatrixA.transformPoint(x, y, this._helpPoint);
                    x = this._helpPoint.x;
                    y = this._helpPoint.y;
                    for (let j = 0; j < vertexBoneCount; ++j) {
                        const rawBoneIndex = rawWeights[iW++]; // uint
                        const boneIndex = weightBoneIndices.indexOf(rawBoneIndex);
                        this._helpMatrixB.copyFromArray(rawBonePoses, boneIndex * 7 + 1);
                        this._helpMatrixB.invert();
                        this._helpMatrixB.transformPoint(x, y, this._helpPoint);
                        this._intArray[iB++] = boneIndex;
                        this._floatArray[iV++] = rawWeights[iW++];
                        this._floatArray[iV++] = this._helpPoint.x;
                        this._floatArray[iV++] = this._helpPoint.y;
                    }
                }
                mesh.weight = weight;
                this._weightSlotPose[meshName] = rawSlotPose;
                this._weightBonePoses[meshName] = rawBonePoses;
            }
        }
        _parseMeshGlue(rawData, mesh) {
            const rawWeights = rawData[dragonBones.DataParser.GLUE_WEIGHTS];
            const rawMeshes = rawData[dragonBones.DataParser.GLUE_MESHES];
            mesh.glue = dragonBones.BaseObject.borrowObject(dragonBones.GlueData);
            mesh.glue.weights.length = rawWeights.length;
            for (let i = 0, l = rawWeights.length; i < l; ++i) {
                mesh.glue.weights[i] = rawWeights[i];
            }
            for (let i = 0, l = rawMeshes.length; i < l; i += 3) {
                const glueMesh = this._armature.getMesh(rawMeshes[i], rawMeshes[i + 1], rawMeshes[i + 2]);
                mesh.glue.addMesh(glueMesh);
            }
        }
        _parseBoundingBox(rawData) {
            let boundingBox = null;
            let type = 0 /* BoundingBoxType.Rectangle */;
            if (dragonBones.DataParser.SUB_TYPE in rawData && typeof rawData[dragonBones.DataParser.SUB_TYPE] === "string") {
                type = dragonBones.DataParser._getBoundingBoxType(rawData[dragonBones.DataParser.SUB_TYPE]);
            }
            else {
                type = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.SUB_TYPE, type);
            }
            switch (type) {
                case 0 /* BoundingBoxType.Rectangle */:
                    boundingBox = dragonBones.BaseObject.borrowObject(dragonBones.RectangleBoundingBoxData);
                    break;
                case 1 /* BoundingBoxType.Ellipse */:
                    boundingBox = dragonBones.BaseObject.borrowObject(dragonBones.EllipseBoundingBoxData);
                    break;
                case 2 /* BoundingBoxType.Polygon */:
                    boundingBox = this._parsePolygonBoundingBox(rawData);
                    break;
            }
            if (boundingBox !== null) {
                boundingBox.color = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.COLOR, 0x000000);
                if (boundingBox.type === 0 /* BoundingBoxType.Rectangle */ || boundingBox.type === 1 /* BoundingBoxType.Ellipse */) {
                    boundingBox.width = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.WIDTH, 0.0);
                    boundingBox.height = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.HEIGHT, 0.0);
                }
            }
            return boundingBox;
        }
        _parsePolygonBoundingBox(rawData) {
            const polygonBoundingBox = dragonBones.BaseObject.borrowObject(dragonBones.PolygonBoundingBoxData);
            if (dragonBones.DataParser.VERTICES in rawData) {
                const scale = this._armature.scale;
                const rawVertices = rawData[dragonBones.DataParser.VERTICES];
                const vertices = polygonBoundingBox.vertices;
                if (dragonBones.DragonBones.webAssembly) {
                    vertices.resize(rawVertices.length, 0.0);
                }
                else {
                    vertices.length = rawVertices.length;
                }
                for (let i = 0, l = rawVertices.length; i < l; i += 2) {
                    let x = rawVertices[i] * scale;
                    let y = rawVertices[i + 1] * scale;
                    if (dragonBones.DragonBones.webAssembly) {
                        vertices.set(i, x);
                        vertices.set(i + 1, y);
                    }
                    else {
                        vertices[i] = x;
                        vertices[i + 1] = y;
                    }
                    // AABB.
                    if (i === 0) {
                        polygonBoundingBox.x = x;
                        polygonBoundingBox.y = y;
                        polygonBoundingBox.width = x;
                        polygonBoundingBox.height = y;
                    }
                    else {
                        if (x < polygonBoundingBox.x) {
                            polygonBoundingBox.x = x;
                        }
                        else if (x > polygonBoundingBox.width) {
                            polygonBoundingBox.width = x;
                        }
                        if (y < polygonBoundingBox.y) {
                            polygonBoundingBox.y = y;
                        }
                        else if (y > polygonBoundingBox.height) {
                            polygonBoundingBox.height = y;
                        }
                    }
                }
                polygonBoundingBox.width -= polygonBoundingBox.x;
                polygonBoundingBox.height -= polygonBoundingBox.y;
            }
            else {
                console.warn("Data error.\n Please reexport DragonBones Data to fixed the bug.");
            }
            return polygonBoundingBox;
        }
        _parseAnimation(rawData) {
            const animation = dragonBones.BaseObject.borrowObject(dragonBones.AnimationData);
            animation.frameCount = Math.max(ObjectDataParser._getNumber(rawData, dragonBones.DataParser.DURATION, 1), 1);
            animation.playTimes = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.PLAY_TIMES, 1);
            animation.duration = animation.frameCount / this._armature.frameRate; // float
            animation.fadeInTime = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.FADE_IN_TIME, 0.0);
            animation.scale = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.SCALE, 1.0);
            animation.name = ObjectDataParser._getString(rawData, dragonBones.DataParser.NAME, dragonBones.DataParser.DEFAULT_NAME);
            if (animation.name.length === 0) {
                animation.name = dragonBones.DataParser.DEFAULT_NAME;
            }
            animation.frameIntOffset = this._frameIntArray.length;
            animation.frameFloatOffset = this._frameFloatArray.length;
            animation.frameOffset = this._frameArray.length;
            this._animation = animation;
            if (dragonBones.DataParser.FRAME in rawData) {
                const rawFrames = rawData[dragonBones.DataParser.FRAME];
                const keyFrameCount = rawFrames.length;
                if (keyFrameCount > 0) {
                    for (let i = 0, frameStart = 0; i < keyFrameCount; ++i) {
                        const rawFrame = rawFrames[i];
                        this._parseActionDataInFrame(rawFrame, frameStart, null, null);
                        frameStart += ObjectDataParser._getNumber(rawFrame, dragonBones.DataParser.DURATION, 1);
                    }
                }
            }
            if (dragonBones.DataParser.Z_ORDER in rawData) {
                this._animation.zOrderTimeline = this._parseTimeline(rawData[dragonBones.DataParser.Z_ORDER], null, dragonBones.DataParser.FRAME, 1 /* TimelineType.ZOrder */, false, false, 0, this._parseZOrderFrame);
            }
            if (dragonBones.DataParser.BONE in rawData) {
                const rawTimelines = rawData[dragonBones.DataParser.BONE];
                for (const rawTimeline of rawTimelines) {
                    this._parseBoneTimeline(rawTimeline);
                }
            }
            if (dragonBones.DataParser.SURFACE in rawData) {
                const rawTimelines = rawData[dragonBones.DataParser.SURFACE];
                for (const rawTimeline of rawTimelines) {
                    const surfaceName = ObjectDataParser._getString(rawTimeline, dragonBones.DataParser.NAME, "");
                    this._surface = this._armature.getBone(surfaceName);
                    if (this._surface === null) {
                        continue;
                    }
                    const timeline = this._parseTimeline(rawTimeline, null, dragonBones.DataParser.FRAME, 50 /* TimelineType.Surface */, false, true, 0, this._parseSurfaceFrame);
                    if (timeline !== null) {
                        this._animation.addSurfaceTimeline(this._surface, timeline);
                    }
                    this._surface = null; //
                }
            }
            if (dragonBones.DataParser.SLOT in rawData) {
                const rawTimelines = rawData[dragonBones.DataParser.SLOT];
                for (const rawTimeline of rawTimelines) {
                    this._parseSlotTimeline(rawTimeline);
                }
            }
            if (dragonBones.DataParser.FFD in rawData) {
                const rawTimelines = rawData[dragonBones.DataParser.FFD];
                for (const rawTimeline of rawTimelines) {
                    let skinName = ObjectDataParser._getString(rawTimeline, dragonBones.DataParser.SKIN, dragonBones.DataParser.DEFAULT_NAME);
                    const slotName = ObjectDataParser._getString(rawTimeline, dragonBones.DataParser.SLOT, "");
                    const displayName = ObjectDataParser._getString(rawTimeline, dragonBones.DataParser.NAME, "");
                    if (skinName.length === 0) { //
                        skinName = dragonBones.DataParser.DEFAULT_NAME;
                    }
                    this._slot = this._armature.getSlot(slotName);
                    this._mesh = this._armature.getMesh(skinName, slotName, displayName);
                    if (this._slot === null || this._mesh === null) {
                        continue;
                    }
                    const timeline = this._parseTimeline(rawTimeline, null, dragonBones.DataParser.FRAME, 22 /* TimelineType.SlotFFD */, false, true, 0, this._parseSlotFFDFrame);
                    if (timeline !== null) {
                        this._animation.addSlotTimeline(this._slot, timeline);
                    }
                    this._slot = null; //
                    this._mesh = null; //
                }
            }
            if (dragonBones.DataParser.IK in rawData) {
                const rawTimelines = rawData[dragonBones.DataParser.IK];
                for (const rawTimeline of rawTimelines) {
                    const constraintName = ObjectDataParser._getString(rawTimeline, dragonBones.DataParser.NAME, "");
                    const constraint = this._armature.getConstraint(constraintName);
                    if (constraint === null) {
                        continue;
                    }
                    const timeline = this._parseTimeline(rawTimeline, null, dragonBones.DataParser.FRAME, 30 /* TimelineType.IKConstraint */, true, false, 2, this._parseIKConstraintFrame);
                    if (timeline !== null) {
                        this._animation.addConstraintTimeline(constraint, timeline);
                    }
                }
            }
            if (dragonBones.DataParser.ANIMATION in rawData) {
                const rawTimelines = rawData[dragonBones.DataParser.ANIMATION];
                for (const rawTimeline of rawTimelines) {
                    const animationName = ObjectDataParser._getString(rawTimeline, dragonBones.DataParser.NAME, "");
                    const timeline = this._parseTimeline(rawTimeline, null, dragonBones.DataParser.FRAME, 40 /* TimelineType.AnimationTime */, true, false, 2, this._parseAnimationFrame);
                    if (timeline !== null) {
                        this._animation.addAnimationTimeline(animationName, timeline);
                    }
                }
            }
            if (this._actionFrames.length > 0) {
                this._animation.actionTimeline = this._parseTimeline(null, this._actionFrames, "", 0 /* TimelineType.Action */, false, false, 0, this._parseActionFrame);
                this._actionFrames.length = 0;
            }
            this._animation = null; //
            return animation;
        }
        _parseTimeline(rawData, rawFrames, framesKey, type, addIntOffset, addFloatOffset, frameValueCount, frameParser) {
            if (rawData !== null && framesKey.length > 0 && framesKey in rawData) {
                rawFrames = rawData[framesKey];
            }
            if (rawFrames === null) {
                return null;
            }
            const keyFrameCount = rawFrames.length;
            if (keyFrameCount === 0) {
                return null;
            }
            const frameIntArrayLength = this._frameIntArray.length;
            const frameFloatArrayLength = this._frameFloatArray.length;
            const timeline = dragonBones.BaseObject.borrowObject(dragonBones.TimelineData);
            const timelineOffset = this._timelineArray.length;
            this._timelineArray.length += 1 + 1 + 1 + 1 + 1 + keyFrameCount;
            if (rawData !== null) {
                this._timelineArray[timelineOffset + 0 /* BinaryOffset.TimelineScale */] = Math.round(ObjectDataParser._getNumber(rawData, dragonBones.DataParser.SCALE, 1.0) * 100);
                this._timelineArray[timelineOffset + 1 /* BinaryOffset.TimelineOffset */] = Math.round(ObjectDataParser._getNumber(rawData, dragonBones.DataParser.OFFSET, 0.0) * 100);
            }
            else {
                this._timelineArray[timelineOffset + 0 /* BinaryOffset.TimelineScale */] = 100;
                this._timelineArray[timelineOffset + 1 /* BinaryOffset.TimelineOffset */] = 0;
            }
            this._timelineArray[timelineOffset + 2 /* BinaryOffset.TimelineKeyFrameCount */] = keyFrameCount;
            this._timelineArray[timelineOffset + 3 /* BinaryOffset.TimelineFrameValueCount */] = frameValueCount;
            if (addIntOffset) {
                this._timelineArray[timelineOffset + 4 /* BinaryOffset.TimelineFrameValueOffset */] = frameIntArrayLength - this._animation.frameIntOffset;
            }
            else if (addFloatOffset) {
                this._timelineArray[timelineOffset + 4 /* BinaryOffset.TimelineFrameValueOffset */] = frameFloatArrayLength - this._animation.frameFloatOffset;
            }
            else {
                this._timelineArray[timelineOffset + 4 /* BinaryOffset.TimelineFrameValueOffset */] = 0;
            }
            this._timeline = timeline;
            timeline.type = type;
            timeline.offset = timelineOffset;
            if (keyFrameCount === 1) { // Only one frame.
                timeline.frameIndicesOffset = -1;
                this._timelineArray[timelineOffset + 5 /* BinaryOffset.TimelineFrameOffset */ + 0] = frameParser.call(this, rawFrames[0], 0, 0) - this._animation.frameOffset;
            }
            else {
                const totalFrameCount = this._animation.frameCount + 1; // One more frame than animation.
                const frameIndices = this._data.frameIndices;
                let frameIndicesOffset = 0;
                if (dragonBones.DragonBones.webAssembly) {
                    frameIndicesOffset = frameIndices.size();
                    frameIndices.resize(frameIndicesOffset + totalFrameCount, 0);
                }
                else {
                    frameIndicesOffset = frameIndices.length;
                    frameIndices.length += totalFrameCount;
                }
                timeline.frameIndicesOffset = frameIndicesOffset;
                for (let i = 0, iK = 0, frameStart = 0, frameCount = 0; i < totalFrameCount; ++i) {
                    if (frameStart + frameCount <= i && iK < keyFrameCount) {
                        const rawFrame = rawFrames[iK];
                        frameStart = i; // frame.frameStart;
                        if (iK === keyFrameCount - 1) {
                            frameCount = this._animation.frameCount - frameStart;
                        }
                        else {
                            if (rawFrame instanceof ActionFrame) {
                                frameCount = this._actionFrames[iK + 1].frameStart - frameStart;
                            }
                            else {
                                frameCount = ObjectDataParser._getNumber(rawFrame, dragonBones.DataParser.DURATION, 1);
                            }
                        }
                        this._timelineArray[timelineOffset + 5 /* BinaryOffset.TimelineFrameOffset */ + iK] = frameParser.call(this, rawFrame, frameStart, frameCount) - this._animation.frameOffset;
                        iK++;
                    }
                    if (dragonBones.DragonBones.webAssembly) {
                        frameIndices.set(frameIndicesOffset + i, iK - 1);
                    }
                    else {
                        frameIndices[frameIndicesOffset + i] = iK - 1;
                    }
                }
            }
            this._timeline = null; //
            return timeline;
        }
        _parseBoneTimeline(rawData) {
            const bone = this._armature.getBone(ObjectDataParser._getString(rawData, dragonBones.DataParser.NAME, ""));
            if (bone === null) {
                return;
            }
            this._bone = bone;
            this._slot = this._armature.getSlot(this._bone.name);
            if (dragonBones.DataParser.TRANSLATE_FRAME in rawData) {
                const timeline = this._parseTimeline(rawData, null, dragonBones.DataParser.TRANSLATE_FRAME, 11 /* TimelineType.BoneTranslate */, false, true, 2, this._parseBoneTranslateFrame);
                if (timeline !== null) {
                    this._animation.addBoneTimeline(bone, timeline);
                }
            }
            if (dragonBones.DataParser.ROTATE_FRAME in rawData) {
                const timeline = this._parseTimeline(rawData, null, dragonBones.DataParser.ROTATE_FRAME, 12 /* TimelineType.BoneRotate */, false, true, 2, this._parseBoneRotateFrame);
                if (timeline !== null) {
                    this._animation.addBoneTimeline(bone, timeline);
                }
            }
            if (dragonBones.DataParser.SCALE_FRAME in rawData) {
                const timeline = this._parseTimeline(rawData, null, dragonBones.DataParser.SCALE_FRAME, 13 /* TimelineType.BoneScale */, false, true, 2, this._parseBoneScaleFrame);
                if (timeline !== null) {
                    this._animation.addBoneTimeline(bone, timeline);
                }
            }
            if (dragonBones.DataParser.FRAME in rawData) {
                const timeline = this._parseTimeline(rawData, null, dragonBones.DataParser.FRAME, 10 /* TimelineType.BoneAll */, false, true, 6, this._parseBoneAllFrame);
                if (timeline !== null) {
                    this._animation.addBoneTimeline(bone, timeline);
                }
            }
            this._bone = null; //
            this._slot = null; //
        }
        _parseSlotTimeline(rawData) {
            const slot = this._armature.getSlot(ObjectDataParser._getString(rawData, dragonBones.DataParser.NAME, ""));
            if (slot === null) {
                return;
            }
            this._slot = slot;
            // Display timeline.
            let displayTimeline = null;
            if (dragonBones.DataParser.DISPLAY_FRAME in rawData) {
                displayTimeline = this._parseTimeline(rawData, null, dragonBones.DataParser.DISPLAY_FRAME, 20 /* TimelineType.SlotDisplay */, false, false, 0, this._parseSlotDisplayFrame);
            }
            else {
                displayTimeline = this._parseTimeline(rawData, null, dragonBones.DataParser.FRAME, 20 /* TimelineType.SlotDisplay */, false, false, 0, this._parseSlotDisplayFrame);
            }
            if (displayTimeline !== null) {
                this._animation.addSlotTimeline(slot, displayTimeline);
            }
            let colorTimeline = null;
            if (dragonBones.DataParser.COLOR_FRAME in rawData) {
                colorTimeline = this._parseTimeline(rawData, null, dragonBones.DataParser.COLOR_FRAME, 21 /* TimelineType.SlotColor */, true, false, 1, this._parseSlotColorFrame);
            }
            else {
                colorTimeline = this._parseTimeline(rawData, null, dragonBones.DataParser.FRAME, 21 /* TimelineType.SlotColor */, true, false, 1, this._parseSlotColorFrame);
            }
            if (colorTimeline !== null) {
                this._animation.addSlotTimeline(slot, colorTimeline);
            }
            this._slot = null; //
        }
        _parseFrame(rawData, frameStart, frameCount) {
            // tslint:disable-next-line:no-unused-expression
            rawData;
            // tslint:disable-next-line:no-unused-expression
            frameCount;
            const frameOffset = this._frameArray.length;
            this._frameArray.length += 1;
            this._frameArray[frameOffset + 0 /* BinaryOffset.FramePosition */] = frameStart;
            return frameOffset;
        }
        _parseTweenFrame(rawData, frameStart, frameCount) {
            const frameOffset = this._parseFrame(rawData, frameStart, frameCount);
            if (frameCount > 0) {
                if (dragonBones.DataParser.CURVE in rawData) {
                    const sampleCount = frameCount + 1;
                    this._helpArray.length = sampleCount;
                    this._samplingEasingCurve(rawData[dragonBones.DataParser.CURVE], this._helpArray);
                    this._frameArray.length += 1 + 1 + this._helpArray.length;
                    this._frameArray[frameOffset + 1 /* BinaryOffset.FrameTweenType */] = 2 /* TweenType.Curve */;
                    this._frameArray[frameOffset + 2 /* BinaryOffset.FrameTweenEasingOrCurveSampleCount */] = sampleCount;
                    for (let i = 0; i < sampleCount; ++i) {
                        this._frameArray[frameOffset + 3 /* BinaryOffset.FrameCurveSamples */ + i] = Math.round(this._helpArray[i] * 10000.0);
                    }
                }
                else {
                    const noTween = -2.0;
                    let tweenEasing = noTween;
                    if (dragonBones.DataParser.TWEEN_EASING in rawData) {
                        tweenEasing = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.TWEEN_EASING, noTween);
                    }
                    if (tweenEasing === noTween) {
                        this._frameArray.length += 1;
                        this._frameArray[frameOffset + 1 /* BinaryOffset.FrameTweenType */] = 0 /* TweenType.None */;
                    }
                    else if (tweenEasing === 0.0) {
                        this._frameArray.length += 1;
                        this._frameArray[frameOffset + 1 /* BinaryOffset.FrameTweenType */] = 1 /* TweenType.Line */;
                    }
                    else if (tweenEasing < 0.0) {
                        this._frameArray.length += 1 + 1;
                        this._frameArray[frameOffset + 1 /* BinaryOffset.FrameTweenType */] = 3 /* TweenType.QuadIn */;
                        this._frameArray[frameOffset + 2 /* BinaryOffset.FrameTweenEasingOrCurveSampleCount */] = Math.round(-tweenEasing * 100.0);
                    }
                    else if (tweenEasing <= 1.0) {
                        this._frameArray.length += 1 + 1;
                        this._frameArray[frameOffset + 1 /* BinaryOffset.FrameTweenType */] = 4 /* TweenType.QuadOut */;
                        this._frameArray[frameOffset + 2 /* BinaryOffset.FrameTweenEasingOrCurveSampleCount */] = Math.round(tweenEasing * 100.0);
                    }
                    else {
                        this._frameArray.length += 1 + 1;
                        this._frameArray[frameOffset + 1 /* BinaryOffset.FrameTweenType */] = 5 /* TweenType.QuadInOut */;
                        this._frameArray[frameOffset + 2 /* BinaryOffset.FrameTweenEasingOrCurveSampleCount */] = Math.round(tweenEasing * 100.0 - 100.0);
                    }
                }
            }
            else {
                this._frameArray.length += 1;
                this._frameArray[frameOffset + 1 /* BinaryOffset.FrameTweenType */] = 0 /* TweenType.None */;
            }
            return frameOffset;
        }
        _parseActionFrame(frame, frameStart, frameCount) {
            // tslint:disable-next-line:no-unused-expression
            frameCount;
            const frameOffset = this._frameArray.length;
            const actionCount = frame.actions.length;
            this._frameArray.length += 1 + 1 + actionCount;
            this._frameArray[frameOffset + 0 /* BinaryOffset.FramePosition */] = frameStart;
            this._frameArray[frameOffset + 0 /* BinaryOffset.FramePosition */ + 1] = actionCount; // Action count.
            for (let i = 0; i < actionCount; ++i) { // Action offsets.
                this._frameArray[frameOffset + 0 /* BinaryOffset.FramePosition */ + 2 + i] = frame.actions[i];
            }
            return frameOffset;
        }
        _parseZOrderFrame(rawData, frameStart, frameCount) {
            const frameOffset = this._parseFrame(rawData, frameStart, frameCount);
            if (dragonBones.DataParser.Z_ORDER in rawData) {
                const rawZOrder = rawData[dragonBones.DataParser.Z_ORDER];
                if (rawZOrder.length > 0) {
                    const slotCount = this._armature.sortedSlots.length;
                    const unchanged = new Array(slotCount - rawZOrder.length / 2);
                    const zOrders = new Array(slotCount);
                    for (let i = 0; i < unchanged.length; ++i) {
                        unchanged[i] = 0;
                    }
                    for (let i = 0; i < slotCount; ++i) {
                        zOrders[i] = -1;
                    }
                    let originalIndex = 0;
                    let unchangedIndex = 0;
                    for (let i = 0, l = rawZOrder.length; i < l; i += 2) {
                        const slotIndex = rawZOrder[i];
                        const zOrderOffset = rawZOrder[i + 1];
                        while (originalIndex !== slotIndex) {
                            unchanged[unchangedIndex++] = originalIndex++;
                        }
                        const index = originalIndex + zOrderOffset;
                        zOrders[index] = originalIndex++;
                    }
                    while (originalIndex < slotCount) {
                        unchanged[unchangedIndex++] = originalIndex++;
                    }
                    this._frameArray.length += 1 + slotCount;
                    this._frameArray[frameOffset + 1] = slotCount;
                    let i = slotCount;
                    while (i--) {
                        if (zOrders[i] === -1) {
                            this._frameArray[frameOffset + 2 + i] = unchanged[--unchangedIndex] || 0;
                        }
                        else {
                            this._frameArray[frameOffset + 2 + i] = zOrders[i] || 0;
                        }
                    }
                    return frameOffset;
                }
            }
            this._frameArray.length += 1;
            this._frameArray[frameOffset + 1] = 0;
            return frameOffset;
        }
        _parseBoneAllFrame(rawData, frameStart, frameCount) {
            this._helpTransform.identity();
            if (dragonBones.DataParser.TRANSFORM in rawData) {
                this._parseTransform(rawData[dragonBones.DataParser.TRANSFORM], this._helpTransform, 1.0);
            }
            // Modify rotation.
            let rotation = this._helpTransform.rotation;
            if (frameStart !== 0) {
                if (this._prevClockwise === 0) {
                    rotation = this._prevRotation + dragonBones.Transform.normalizeRadian(rotation - this._prevRotation);
                }
                else {
                    if (this._prevClockwise > 0 ? rotation >= this._prevRotation : rotation <= this._prevRotation) {
                        this._prevClockwise = this._prevClockwise > 0 ? this._prevClockwise - 1 : this._prevClockwise + 1;
                    }
                    rotation = this._prevRotation + rotation - this._prevRotation + dragonBones.Transform.PI_D * this._prevClockwise;
                }
            }
            this._prevClockwise = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.TWEEN_ROTATE, 0.0);
            this._prevRotation = rotation;
            //
            const frameOffset = this._parseTweenFrame(rawData, frameStart, frameCount);
            let frameFloatOffset = this._frameFloatArray.length;
            this._frameFloatArray.length += 6;
            this._frameFloatArray[frameFloatOffset++] = this._helpTransform.x;
            this._frameFloatArray[frameFloatOffset++] = this._helpTransform.y;
            this._frameFloatArray[frameFloatOffset++] = rotation;
            this._frameFloatArray[frameFloatOffset++] = this._helpTransform.skew;
            this._frameFloatArray[frameFloatOffset++] = this._helpTransform.scaleX;
            this._frameFloatArray[frameFloatOffset++] = this._helpTransform.scaleY;
            this._parseActionDataInFrame(rawData, frameStart, this._bone, this._slot);
            return frameOffset;
        }
        _parseBoneTranslateFrame(rawData, frameStart, frameCount) {
            const frameOffset = this._parseTweenFrame(rawData, frameStart, frameCount);
            let frameFloatOffset = this._frameFloatArray.length;
            this._frameFloatArray.length += 2;
            this._frameFloatArray[frameFloatOffset++] = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.X, 0.0);
            this._frameFloatArray[frameFloatOffset++] = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.Y, 0.0);
            return frameOffset;
        }
        _parseBoneRotateFrame(rawData, frameStart, frameCount) {
            // Modify rotation.
            let rotation = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.ROTATE, 0.0) * dragonBones.Transform.DEG_RAD;
            if (frameStart !== 0) {
                if (this._prevClockwise === 0) {
                    rotation = this._prevRotation + dragonBones.Transform.normalizeRadian(rotation - this._prevRotation);
                }
                else {
                    if (this._prevClockwise > 0 ? rotation >= this._prevRotation : rotation <= this._prevRotation) {
                        this._prevClockwise = this._prevClockwise > 0 ? this._prevClockwise - 1 : this._prevClockwise + 1;
                    }
                    rotation = this._prevRotation + rotation - this._prevRotation + dragonBones.Transform.PI_D * this._prevClockwise;
                }
            }
            this._prevClockwise = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.CLOCK_WISE, 0);
            this._prevRotation = rotation;
            //
            const frameOffset = this._parseTweenFrame(rawData, frameStart, frameCount);
            let frameFloatOffset = this._frameFloatArray.length;
            this._frameFloatArray.length += 2;
            this._frameFloatArray[frameFloatOffset++] = rotation;
            this._frameFloatArray[frameFloatOffset++] = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.SKEW, 0.0) * dragonBones.Transform.DEG_RAD;
            return frameOffset;
        }
        _parseBoneScaleFrame(rawData, frameStart, frameCount) {
            const frameOffset = this._parseTweenFrame(rawData, frameStart, frameCount);
            let frameFloatOffset = this._frameFloatArray.length;
            this._frameFloatArray.length += 2;
            this._frameFloatArray[frameFloatOffset++] = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.X, 1.0);
            this._frameFloatArray[frameFloatOffset++] = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.Y, 1.0);
            return frameOffset;
        }
        _parseSurfaceFrame(rawData, frameStart, frameCount) {
            const frameFloatOffset = this._frameFloatArray.length;
            const frameOffset = this._parseTweenFrame(rawData, frameStart, frameCount);
            const rawVertices = rawData[dragonBones.DataParser.VERTICES];
            const offset = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.OFFSET, 0); // uint
            const vertexCount = this._surface.vertices.length / 2; // uint
            let x = 0.0;
            let y = 0.0;
            this._frameFloatArray.length += vertexCount * 2;
            for (let i = 0; i < vertexCount * 2; i += 2) {
                if (i < offset || i - offset >= rawVertices.length) {
                    x = 0.0;
                }
                else {
                    x = rawVertices[i - offset];
                }
                if (i + 1 < offset || i + 1 - offset >= rawVertices.length) {
                    y = 0.0;
                }
                else {
                    y = rawVertices[i + 1 - offset];
                }
                this._frameFloatArray[frameFloatOffset + i] = x;
                this._frameFloatArray[frameFloatOffset + i + 1] = y;
            }
            if (frameStart === 0) {
                const frameIntOffset = this._frameIntArray.length;
                this._frameIntArray.length += 1 + 1 + 1 + 1 + 1;
                this._frameIntArray[frameIntOffset + 0 /* BinaryOffset.DeformMeshOffset */] = 0; // 
                this._frameIntArray[frameIntOffset + 1 /* BinaryOffset.DeformCount */] = this._frameFloatArray.length - frameFloatOffset;
                this._frameIntArray[frameIntOffset + 2 /* BinaryOffset.DeformValueCount */] = this._frameFloatArray.length - frameFloatOffset;
                this._frameIntArray[frameIntOffset + 3 /* BinaryOffset.DeformValueOffset */] = 0;
                this._frameIntArray[frameIntOffset + 4 /* BinaryOffset.DeformFloatOffset */] = frameFloatOffset - this._animation.frameFloatOffset;
                this._timelineArray[this._timeline.offset + 3 /* BinaryOffset.TimelineFrameValueCount */] = frameIntOffset - this._animation.frameIntOffset;
            }
            return frameOffset;
        }
        _parseSlotDisplayFrame(rawData, frameStart, frameCount) {
            const frameOffset = this._parseFrame(rawData, frameStart, frameCount);
            this._frameArray.length += 1;
            if (dragonBones.DataParser.VALUE in rawData) {
                this._frameArray[frameOffset + 1] = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.VALUE, 0);
            }
            else {
                this._frameArray[frameOffset + 1] = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.DISPLAY_INDEX, 0);
            }
            this._parseActionDataInFrame(rawData, frameStart, this._slot.parent, this._slot);
            return frameOffset;
        }
        _parseSlotColorFrame(rawData, frameStart, frameCount) {
            const frameOffset = this._parseTweenFrame(rawData, frameStart, frameCount);
            let colorOffset = -1;
            if (dragonBones.DataParser.VALUE in rawData || dragonBones.DataParser.COLOR in rawData) {
                const rawColor = dragonBones.DataParser.VALUE in rawData ? rawData[dragonBones.DataParser.VALUE] : rawData[dragonBones.DataParser.COLOR];
                for (let k in rawColor) { // Detects the presence of color.
                    // tslint:disable-next-line:no-unused-expression
                    k;
                    this._parseColorTransform(rawColor, this._helpColorTransform);
                    colorOffset = this._intArray.length;
                    this._intArray.length += 8;
                    this._intArray[colorOffset++] = Math.round(this._helpColorTransform.alphaMultiplier * 100);
                    this._intArray[colorOffset++] = Math.round(this._helpColorTransform.redMultiplier * 100);
                    this._intArray[colorOffset++] = Math.round(this._helpColorTransform.greenMultiplier * 100);
                    this._intArray[colorOffset++] = Math.round(this._helpColorTransform.blueMultiplier * 100);
                    this._intArray[colorOffset++] = Math.round(this._helpColorTransform.alphaOffset);
                    this._intArray[colorOffset++] = Math.round(this._helpColorTransform.redOffset);
                    this._intArray[colorOffset++] = Math.round(this._helpColorTransform.greenOffset);
                    this._intArray[colorOffset++] = Math.round(this._helpColorTransform.blueOffset);
                    colorOffset -= 8;
                    break;
                }
            }
            if (colorOffset < 0) {
                if (this._defaultColorOffset < 0) {
                    this._defaultColorOffset = colorOffset = this._intArray.length;
                    this._intArray.length += 8;
                    this._intArray[colorOffset++] = 100;
                    this._intArray[colorOffset++] = 100;
                    this._intArray[colorOffset++] = 100;
                    this._intArray[colorOffset++] = 100;
                    this._intArray[colorOffset++] = 0;
                    this._intArray[colorOffset++] = 0;
                    this._intArray[colorOffset++] = 0;
                    this._intArray[colorOffset++] = 0;
                }
                colorOffset = this._defaultColorOffset;
            }
            const frameIntOffset = this._frameIntArray.length;
            this._frameIntArray.length += 1;
            this._frameIntArray[frameIntOffset] = colorOffset;
            return frameOffset;
        }
        _parseSlotFFDFrame(rawData, frameStart, frameCount) {
            const frameFloatOffset = this._frameFloatArray.length;
            const frameOffset = this._parseTweenFrame(rawData, frameStart, frameCount);
            const rawVertices = dragonBones.DataParser.VERTICES in rawData ? rawData[dragonBones.DataParser.VERTICES] : null;
            const offset = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.OFFSET, 0); // uint
            const vertexCount = this._intArray[this._mesh.offset + 0 /* BinaryOffset.MeshVertexCount */];
            const meshName = this._mesh.parent.name + "_" + this._slot.name + "_" + this._mesh.name;
            let x = 0.0;
            let y = 0.0;
            let iB = 0;
            let iV = 0;
            if (this._mesh.weight !== null) {
                const rawSlotPose = this._weightSlotPose[meshName];
                this._helpMatrixA.copyFromArray(rawSlotPose, 0);
                this._frameFloatArray.length += this._mesh.weight.count * 2;
                iB = this._mesh.weight.offset + 2 /* BinaryOffset.WeigthBoneIndices */ + this._mesh.weight.bones.length;
            }
            else {
                this._frameFloatArray.length += vertexCount * 2;
            }
            for (let i = 0; i < vertexCount * 2; i += 2) {
                if (rawVertices === null) { // Fill 0.
                    x = 0.0;
                    y = 0.0;
                }
                else {
                    if (i < offset || i - offset >= rawVertices.length) {
                        x = 0.0;
                    }
                    else {
                        x = rawVertices[i - offset];
                    }
                    if (i + 1 < offset || i + 1 - offset >= rawVertices.length) {
                        y = 0.0;
                    }
                    else {
                        y = rawVertices[i + 1 - offset];
                    }
                }
                if (this._mesh.weight !== null) { // If mesh is skinned, transform point by bone bind pose.
                    const rawBonePoses = this._weightBonePoses[meshName];
                    const vertexBoneCount = this._intArray[iB++];
                    this._helpMatrixA.transformPoint(x, y, this._helpPoint, true);
                    x = this._helpPoint.x;
                    y = this._helpPoint.y;
                    for (let j = 0; j < vertexBoneCount; ++j) {
                        const boneIndex = this._intArray[iB++];
                        this._helpMatrixB.copyFromArray(rawBonePoses, boneIndex * 7 + 1);
                        this._helpMatrixB.invert();
                        this._helpMatrixB.transformPoint(x, y, this._helpPoint, true);
                        this._frameFloatArray[frameFloatOffset + iV++] = this._helpPoint.x;
                        this._frameFloatArray[frameFloatOffset + iV++] = this._helpPoint.y;
                    }
                }
                else {
                    this._frameFloatArray[frameFloatOffset + i] = x;
                    this._frameFloatArray[frameFloatOffset + i + 1] = y;
                }
            }
            if (frameStart === 0) {
                const frameIntOffset = this._frameIntArray.length;
                this._frameIntArray.length += 1 + 1 + 1 + 1 + 1;
                this._frameIntArray[frameIntOffset + 0 /* BinaryOffset.DeformMeshOffset */] = this._mesh.offset;
                this._frameIntArray[frameIntOffset + 1 /* BinaryOffset.DeformCount */] = this._frameFloatArray.length - frameFloatOffset;
                this._frameIntArray[frameIntOffset + 2 /* BinaryOffset.DeformValueCount */] = this._frameFloatArray.length - frameFloatOffset;
                this._frameIntArray[frameIntOffset + 3 /* BinaryOffset.DeformValueOffset */] = 0;
                this._frameIntArray[frameIntOffset + 4 /* BinaryOffset.DeformFloatOffset */] = frameFloatOffset - this._animation.frameFloatOffset;
                this._timelineArray[this._timeline.offset + 3 /* BinaryOffset.TimelineFrameValueCount */] = frameIntOffset - this._animation.frameIntOffset;
            }
            return frameOffset;
        }
        _parseIKConstraintFrame(rawData, frameStart, frameCount) {
            const frameOffset = this._parseTweenFrame(rawData, frameStart, frameCount);
            let frameIntOffset = this._frameIntArray.length;
            this._frameIntArray.length += 2;
            this._frameIntArray[frameIntOffset++] = ObjectDataParser._getBoolean(rawData, dragonBones.DataParser.BEND_POSITIVE, true) ? 1 : 0;
            this._frameIntArray[frameIntOffset++] = Math.round(ObjectDataParser._getNumber(rawData, dragonBones.DataParser.WEIGHT, 1.0) * 100.0);
            return frameOffset;
        }
        _parseAnimationFrame(rawData, frameStart, frameCount) {
            const frameOffset = this._parseTweenFrame(rawData, frameStart, frameCount);
            let frameIntOffset = this._frameIntArray.length;
            this._frameIntArray.length += 2;
            this._frameIntArray[frameIntOffset++] = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.VALUE, 0);
            this._frameIntArray[frameIntOffset++] = Math.round(ObjectDataParser._getNumber(rawData, dragonBones.DataParser.WEIGHT, 1.0) * 100.0);
            return frameOffset;
        }
        _parseActionData(rawData, type, bone, slot) {
            const actions = new Array();
            if (typeof rawData === "string") {
                const action = dragonBones.BaseObject.borrowObject(dragonBones.ActionData);
                action.type = type;
                action.name = rawData;
                action.bone = bone;
                action.slot = slot;
                actions.push(action);
            }
            else if (rawData instanceof Array) {
                for (const rawAction of rawData) {
                    const action = dragonBones.BaseObject.borrowObject(dragonBones.ActionData);
                    if (dragonBones.DataParser.GOTO_AND_PLAY in rawAction) {
                        action.type = 0 /* ActionType.Play */;
                        action.name = ObjectDataParser._getString(rawAction, dragonBones.DataParser.GOTO_AND_PLAY, "");
                    }
                    else {
                        if (dragonBones.DataParser.TYPE in rawAction && typeof rawAction[dragonBones.DataParser.TYPE] === "string") {
                            action.type = dragonBones.DataParser._getActionType(rawAction[dragonBones.DataParser.TYPE]);
                        }
                        else {
                            action.type = ObjectDataParser._getNumber(rawAction, dragonBones.DataParser.TYPE, type);
                        }
                        action.name = ObjectDataParser._getString(rawAction, dragonBones.DataParser.NAME, "");
                    }
                    if (dragonBones.DataParser.BONE in rawAction) {
                        const boneName = ObjectDataParser._getString(rawAction, dragonBones.DataParser.BONE, "");
                        action.bone = this._armature.getBone(boneName);
                    }
                    else {
                        action.bone = bone;
                    }
                    if (dragonBones.DataParser.SLOT in rawAction) {
                        const slotName = ObjectDataParser._getString(rawAction, dragonBones.DataParser.SLOT, "");
                        action.slot = this._armature.getSlot(slotName);
                    }
                    else {
                        action.slot = slot;
                    }
                    let userData = null;
                    if (dragonBones.DataParser.INTS in rawAction) {
                        if (userData === null) {
                            userData = dragonBones.BaseObject.borrowObject(dragonBones.UserData);
                        }
                        const rawInts = rawAction[dragonBones.DataParser.INTS];
                        for (const rawValue of rawInts) {
                            userData.addInt(rawValue);
                        }
                    }
                    if (dragonBones.DataParser.FLOATS in rawAction) {
                        if (userData === null) {
                            userData = dragonBones.BaseObject.borrowObject(dragonBones.UserData);
                        }
                        const rawFloats = rawAction[dragonBones.DataParser.FLOATS];
                        for (const rawValue of rawFloats) {
                            userData.addFloat(rawValue);
                        }
                    }
                    if (dragonBones.DataParser.STRINGS in rawAction) {
                        if (userData === null) {
                            userData = dragonBones.BaseObject.borrowObject(dragonBones.UserData);
                        }
                        const rawStrings = rawAction[dragonBones.DataParser.STRINGS];
                        for (const rawValue of rawStrings) {
                            userData.addString(rawValue);
                        }
                    }
                    action.data = userData;
                    actions.push(action);
                }
            }
            return actions;
        }
        _parseTransform(rawData, transform, scale) {
            transform.x = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.X, 0.0) * scale;
            transform.y = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.Y, 0.0) * scale;
            if (dragonBones.DataParser.ROTATE in rawData || dragonBones.DataParser.SKEW in rawData) {
                transform.rotation = dragonBones.Transform.normalizeRadian(ObjectDataParser._getNumber(rawData, dragonBones.DataParser.ROTATE, 0.0) * dragonBones.Transform.DEG_RAD);
                transform.skew = dragonBones.Transform.normalizeRadian(ObjectDataParser._getNumber(rawData, dragonBones.DataParser.SKEW, 0.0) * dragonBones.Transform.DEG_RAD);
            }
            else if (dragonBones.DataParser.SKEW_X in rawData || dragonBones.DataParser.SKEW_Y in rawData) {
                transform.rotation = dragonBones.Transform.normalizeRadian(ObjectDataParser._getNumber(rawData, dragonBones.DataParser.SKEW_Y, 0.0) * dragonBones.Transform.DEG_RAD);
                transform.skew = dragonBones.Transform.normalizeRadian(ObjectDataParser._getNumber(rawData, dragonBones.DataParser.SKEW_X, 0.0) * dragonBones.Transform.DEG_RAD) - transform.rotation;
            }
            transform.scaleX = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.SCALE_X, 1.0);
            transform.scaleY = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.SCALE_Y, 1.0);
        }
        _parseColorTransform(rawData, color) {
            color.alphaMultiplier = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.ALPHA_MULTIPLIER, 100) * 0.01;
            color.redMultiplier = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.RED_MULTIPLIER, 100) * 0.01;
            color.greenMultiplier = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.GREEN_MULTIPLIER, 100) * 0.01;
            color.blueMultiplier = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.BLUE_MULTIPLIER, 100) * 0.01;
            color.alphaOffset = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.ALPHA_OFFSET, 0);
            color.redOffset = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.RED_OFFSET, 0);
            color.greenOffset = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.GREEN_OFFSET, 0);
            color.blueOffset = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.BLUE_OFFSET, 0);
        }
        _parseArray(rawData) {
            // tslint:disable-next-line:no-unused-expression
            rawData;
            this._intArray.length = 0;
            this._floatArray.length = 0;
            this._frameIntArray.length = 0;
            this._frameFloatArray.length = 0;
            this._frameArray.length = 0;
            this._timelineArray.length = 0;
        }
        _modifyArray() {
            // Align.
            if ((this._intArray.length % Int16Array.BYTES_PER_ELEMENT) !== 0) {
                this._intArray.push(0);
            }
            if ((this._frameIntArray.length % Int16Array.BYTES_PER_ELEMENT) !== 0) {
                this._frameIntArray.push(0);
            }
            if ((this._frameArray.length % Int16Array.BYTES_PER_ELEMENT) !== 0) {
                this._frameArray.push(0);
            }
            if ((this._timelineArray.length % Uint16Array.BYTES_PER_ELEMENT) !== 0) {
                this._timelineArray.push(0);
            }
            const l1 = this._intArray.length * Int16Array.BYTES_PER_ELEMENT;
            const l2 = this._floatArray.length * Float32Array.BYTES_PER_ELEMENT;
            const l3 = this._frameIntArray.length * Int16Array.BYTES_PER_ELEMENT;
            const l4 = this._frameFloatArray.length * Float32Array.BYTES_PER_ELEMENT;
            const l5 = this._frameArray.length * Int16Array.BYTES_PER_ELEMENT;
            const l6 = this._timelineArray.length * Uint16Array.BYTES_PER_ELEMENT;
            const lTotal = l1 + l2 + l3 + l4 + l5 + l6;
            if (dragonBones.DragonBones.webAssembly) {
                const shareBuffer = dragonBones.webAssemblyModule.HEAP16.buffer;
                const bufferPointer = dragonBones.webAssemblyModule._malloc(lTotal);
                const intArray = new Int16Array(shareBuffer, bufferPointer, this._intArray.length);
                const floatArray = new Float32Array(shareBuffer, bufferPointer + l1, this._floatArray.length);
                const frameIntArray = new Int16Array(shareBuffer, bufferPointer + l1 + l2, this._frameIntArray.length);
                const frameFloatArray = new Float32Array(shareBuffer, bufferPointer + l1 + l2 + l3, this._frameFloatArray.length);
                const frameArray = new Int16Array(shareBuffer, bufferPointer + l1 + l2 + l3 + l4, this._frameArray.length);
                const timelineArray = new Uint16Array(shareBuffer, bufferPointer + l1 + l2 + l3 + l4 + l5, this._timelineArray.length);
                for (let i = 0, l = this._intArray.length; i < l; ++i) {
                    intArray[i] = this._intArray[i];
                }
                for (let i = 0, l = this._floatArray.length; i < l; ++i) {
                    floatArray[i] = this._floatArray[i];
                }
                for (let i = 0, l = this._frameIntArray.length; i < l; ++i) {
                    frameIntArray[i] = this._frameIntArray[i];
                }
                for (let i = 0, l = this._frameFloatArray.length; i < l; ++i) {
                    frameFloatArray[i] = this._frameFloatArray[i];
                }
                for (let i = 0, l = this._frameArray.length; i < l; ++i) {
                    frameArray[i] = this._frameArray[i];
                }
                for (let i = 0, l = this._timelineArray.length; i < l; ++i) {
                    timelineArray[i] = this._timelineArray[i];
                }
                dragonBones.webAssemblyModule.setDataBinary(this._data, bufferPointer, l1, l2, l3, l4, l5, l6);
            }
            else {
                const binary = new ArrayBuffer(lTotal);
                const intArray = new Int16Array(binary, 0, this._intArray.length);
                const floatArray = new Float32Array(binary, l1, this._floatArray.length);
                const frameIntArray = new Int16Array(binary, l1 + l2, this._frameIntArray.length);
                const frameFloatArray = new Float32Array(binary, l1 + l2 + l3, this._frameFloatArray.length);
                const frameArray = new Int16Array(binary, l1 + l2 + l3 + l4, this._frameArray.length);
                const timelineArray = new Uint16Array(binary, l1 + l2 + l3 + l4 + l5, this._timelineArray.length);
                for (let i = 0, l = this._intArray.length; i < l; ++i) {
                    intArray[i] = this._intArray[i];
                }
                for (let i = 0, l = this._floatArray.length; i < l; ++i) {
                    floatArray[i] = this._floatArray[i];
                }
                for (let i = 0, l = this._frameIntArray.length; i < l; ++i) {
                    frameIntArray[i] = this._frameIntArray[i];
                }
                for (let i = 0, l = this._frameFloatArray.length; i < l; ++i) {
                    frameFloatArray[i] = this._frameFloatArray[i];
                }
                for (let i = 0, l = this._frameArray.length; i < l; ++i) {
                    frameArray[i] = this._frameArray[i];
                }
                for (let i = 0, l = this._timelineArray.length; i < l; ++i) {
                    timelineArray[i] = this._timelineArray[i];
                }
                this._data.binary = binary;
                this._data.intArray = intArray;
                this._data.floatArray = floatArray;
                this._data.frameIntArray = frameIntArray;
                this._data.frameFloatArray = frameFloatArray;
                this._data.frameArray = frameArray;
                this._data.timelineArray = timelineArray;
            }
            this._defaultColorOffset = -1;
        }
        parseDragonBonesData(rawData, scale = 1) {
            console.assert(rawData !== null && rawData !== undefined, "Data error.");
            const version = ObjectDataParser._getString(rawData, dragonBones.DataParser.VERSION, "");
            const compatibleVersion = ObjectDataParser._getString(rawData, dragonBones.DataParser.COMPATIBLE_VERSION, "");
            if (dragonBones.DataParser.DATA_VERSIONS.indexOf(version) >= 0 ||
                dragonBones.DataParser.DATA_VERSIONS.indexOf(compatibleVersion) >= 0) {
                const data = dragonBones.BaseObject.borrowObject(dragonBones.DragonBonesData);
                data.version = version;
                data.name = ObjectDataParser._getString(rawData, dragonBones.DataParser.NAME, "");
                data.frameRate = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.FRAME_RATE, 24);
                if (data.frameRate === 0) { // Data error.
                    data.frameRate = 24;
                }
                if (dragonBones.DataParser.ARMATURE in rawData) {
                    this._data = data;
                    this._parseArray(rawData);
                    const rawArmatures = rawData[dragonBones.DataParser.ARMATURE];
                    for (const rawArmature of rawArmatures) {
                        data.addArmature(this._parseArmature(rawArmature, scale));
                    }
                    if (!this._data.binary) { // DragonBones.webAssembly ? 0 : null;
                        this._modifyArray();
                    }
                    if (dragonBones.DataParser.STAGE in rawData) {
                        data.stage = data.getArmature(ObjectDataParser._getString(rawData, dragonBones.DataParser.STAGE, ""));
                    }
                    else if (data.armatureNames.length > 0) {
                        data.stage = data.getArmature(data.armatureNames[0]);
                    }
                    this._data = null;
                }
                if (dragonBones.DataParser.TEXTURE_ATLAS in rawData) {
                    this._rawTextureAtlases = rawData[dragonBones.DataParser.TEXTURE_ATLAS];
                }
                return data;
            }
            else {
                console.assert(false, "Nonsupport data version: " + version + "\n" +
                    "Please convert DragonBones data to support version.\n" +
                    "Read more: https://github.com/DragonBones/Tools/");
            }
            return null;
        }
        parseTextureAtlasData(rawData, textureAtlasData, scale = 1.0) {
            console.assert(rawData !== undefined);
            if (rawData === null) {
                if (this._rawTextureAtlases === null || this._rawTextureAtlases.length === 0) {
                    return false;
                }
                const rawTextureAtlas = this._rawTextureAtlases[this._rawTextureAtlasIndex++];
                this.parseTextureAtlasData(rawTextureAtlas, textureAtlasData, scale);
                if (this._rawTextureAtlasIndex >= this._rawTextureAtlases.length) {
                    this._rawTextureAtlasIndex = 0;
                    this._rawTextureAtlases = null;
                }
                return true;
            }
            // Texture format.
            textureAtlasData.width = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.WIDTH, 0);
            textureAtlasData.height = ObjectDataParser._getNumber(rawData, dragonBones.DataParser.HEIGHT, 0);
            textureAtlasData.scale = scale === 1.0 ? (1.0 / ObjectDataParser._getNumber(rawData, dragonBones.DataParser.SCALE, 1.0)) : scale;
            textureAtlasData.name = ObjectDataParser._getString(rawData, dragonBones.DataParser.NAME, "");
            textureAtlasData.imagePath = ObjectDataParser._getString(rawData, dragonBones.DataParser.IMAGE_PATH, "");
            if (dragonBones.DataParser.SUB_TEXTURE in rawData) {
                const rawTextures = rawData[dragonBones.DataParser.SUB_TEXTURE];
                for (let i = 0, l = rawTextures.length; i < l; ++i) {
                    const rawTexture = rawTextures[i];
                    const textureData = textureAtlasData.createTexture();
                    textureData.rotated = ObjectDataParser._getBoolean(rawTexture, dragonBones.DataParser.ROTATED, false);
                    textureData.name = ObjectDataParser._getString(rawTexture, dragonBones.DataParser.NAME, "");
                    textureData.region.x = ObjectDataParser._getNumber(rawTexture, dragonBones.DataParser.X, 0.0);
                    textureData.region.y = ObjectDataParser._getNumber(rawTexture, dragonBones.DataParser.Y, 0.0);
                    textureData.region.width = ObjectDataParser._getNumber(rawTexture, dragonBones.DataParser.WIDTH, 0.0);
                    textureData.region.height = ObjectDataParser._getNumber(rawTexture, dragonBones.DataParser.HEIGHT, 0.0);
                    const frameWidth = ObjectDataParser._getNumber(rawTexture, dragonBones.DataParser.FRAME_WIDTH, -1.0);
                    const frameHeight = ObjectDataParser._getNumber(rawTexture, dragonBones.DataParser.FRAME_HEIGHT, -1.0);
                    if (frameWidth > 0.0 && frameHeight > 0.0) {
                        textureData.frame = dragonBones.TextureData.createRectangle();
                        textureData.frame.x = ObjectDataParser._getNumber(rawTexture, dragonBones.DataParser.FRAME_X, 0.0);
                        textureData.frame.y = ObjectDataParser._getNumber(rawTexture, dragonBones.DataParser.FRAME_Y, 0.0);
                        textureData.frame.width = frameWidth;
                        textureData.frame.height = frameHeight;
                    }
                    textureAtlasData.addTexture(textureData);
                }
            }
            return true;
        }
        /**
         * - Deprecated, please refer to {@link dragonBones.BaseFactory#parseDragonBonesData()}.
         * @deprecated
         * @language en_US
         */
        /**
         * - 已废弃，请参考 {@link dragonBones.BaseFactory#parseDragonBonesData()}。
         * @deprecated
         * @language zh_CN
         */
        static getInstance() {
            if (ObjectDataParser._objectDataParserInstance === null) {
                ObjectDataParser._objectDataParserInstance = new ObjectDataParser();
            }
            return ObjectDataParser._objectDataParserInstance;
        }
    }
    ObjectDataParser._objectDataParserInstance = null;
    dragonBones.ObjectDataParser = ObjectDataParser;
    /**
     * @internal
     * @private
     */
    class ActionFrame {
        constructor() {
            this.frameStart = 0;
            this.actions = [];
        }
    }
    dragonBones.ActionFrame = ActionFrame;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * @internal
     * @private
     */
    class BinaryDataParser extends dragonBones.ObjectDataParser {
        _inRange(a, min, max) {
            return min <= a && a <= max;
        }
        _decodeUTF8(data) {
            const EOF_byte = -1;
            const EOF_code_point = -1;
            const FATAL_POINT = 0xFFFD;
            let pos = 0;
            let result = "";
            let code_point;
            let utf8_code_point = 0;
            let utf8_bytes_needed = 0;
            let utf8_bytes_seen = 0;
            let utf8_lower_boundary = 0;
            while (data.length > pos) {
                let _byte = data[pos++];
                if (_byte === EOF_byte) {
                    if (utf8_bytes_needed !== 0) {
                        code_point = FATAL_POINT;
                    }
                    else {
                        code_point = EOF_code_point;
                    }
                }
                else {
                    if (utf8_bytes_needed === 0) {
                        if (this._inRange(_byte, 0x00, 0x7F)) {
                            code_point = _byte;
                        }
                        else {
                            if (this._inRange(_byte, 0xC2, 0xDF)) {
                                utf8_bytes_needed = 1;
                                utf8_lower_boundary = 0x80;
                                utf8_code_point = _byte - 0xC0;
                            }
                            else if (this._inRange(_byte, 0xE0, 0xEF)) {
                                utf8_bytes_needed = 2;
                                utf8_lower_boundary = 0x800;
                                utf8_code_point = _byte - 0xE0;
                            }
                            else if (this._inRange(_byte, 0xF0, 0xF4)) {
                                utf8_bytes_needed = 3;
                                utf8_lower_boundary = 0x10000;
                                utf8_code_point = _byte - 0xF0;
                            }
                            else {
                            }
                            utf8_code_point = utf8_code_point * Math.pow(64, utf8_bytes_needed);
                            code_point = null;
                        }
                    }
                    else if (!this._inRange(_byte, 0x80, 0xBF)) {
                        utf8_code_point = 0;
                        utf8_bytes_needed = 0;
                        utf8_bytes_seen = 0;
                        utf8_lower_boundary = 0;
                        pos--;
                        code_point = _byte;
                    }
                    else {
                        utf8_bytes_seen += 1;
                        utf8_code_point = utf8_code_point + (_byte - 0x80) * Math.pow(64, utf8_bytes_needed - utf8_bytes_seen);
                        if (utf8_bytes_seen !== utf8_bytes_needed) {
                            code_point = null;
                        }
                        else {
                            let cp = utf8_code_point;
                            let lower_boundary = utf8_lower_boundary;
                            utf8_code_point = 0;
                            utf8_bytes_needed = 0;
                            utf8_bytes_seen = 0;
                            utf8_lower_boundary = 0;
                            if (this._inRange(cp, lower_boundary, 0x10FFFF) && !this._inRange(cp, 0xD800, 0xDFFF)) {
                                code_point = cp;
                            }
                            else {
                                code_point = _byte;
                            }
                        }
                    }
                }
                //Decode string
                if (code_point !== null && code_point !== EOF_code_point) {
                    if (code_point <= 0xFFFF) {
                        if (code_point > 0)
                            result += String.fromCharCode(code_point);
                    }
                    else {
                        code_point -= 0x10000;
                        result += String.fromCharCode(0xD800 + ((code_point >> 10) & 0x3ff));
                        result += String.fromCharCode(0xDC00 + (code_point & 0x3ff));
                    }
                }
            }
            return result;
        }
        _getUTF16Key(value) {
            for (let i = 0, l = value.length; i < l; ++i) {
                if (value.charCodeAt(i) > 255) {
                    return encodeURI(value);
                }
            }
            return value;
        }
        _parseBinaryTimeline(type, offset, timelineData = null) {
            const timeline = timelineData !== null ? timelineData : dragonBones.BaseObject.borrowObject(dragonBones.TimelineData);
            timeline.type = type;
            timeline.offset = offset;
            this._timeline = timeline;
            const keyFrameCount = this._timelineArrayBuffer[timeline.offset + 2 /* BinaryOffset.TimelineKeyFrameCount */];
            if (keyFrameCount === 1) {
                timeline.frameIndicesOffset = -1;
            }
            else {
                let frameIndicesOffset = 0;
                const totalFrameCount = this._animation.frameCount + 1; // One more frame than animation.
                const frameIndices = this._data.frameIndices;
                if (dragonBones.DragonBones.webAssembly) {
                    frameIndicesOffset = frameIndices.size();
                    frameIndices.resize(frameIndicesOffset + totalFrameCount, 0);
                }
                else {
                    frameIndicesOffset = frameIndices.length;
                    frameIndices.length += totalFrameCount;
                }
                timeline.frameIndicesOffset = frameIndicesOffset;
                for (let i = 0, iK = 0, frameStart = 0, frameCount = 0; i < totalFrameCount; ++i) {
                    if (frameStart + frameCount <= i && iK < keyFrameCount) {
                        frameStart = this._frameArrayBuffer[this._animation.frameOffset + this._timelineArrayBuffer[timeline.offset + 5 /* BinaryOffset.TimelineFrameOffset */ + iK]];
                        if (iK === keyFrameCount - 1) {
                            frameCount = this._animation.frameCount - frameStart;
                        }
                        else {
                            frameCount = this._frameArrayBuffer[this._animation.frameOffset + this._timelineArrayBuffer[timeline.offset + 5 /* BinaryOffset.TimelineFrameOffset */ + iK + 1]] - frameStart;
                        }
                        iK++;
                    }
                    if (dragonBones.DragonBones.webAssembly) {
                        frameIndices.set(frameIndicesOffset + i, iK - 1);
                    }
                    else {
                        frameIndices[frameIndicesOffset + i] = iK - 1;
                    }
                }
            }
            this._timeline = null; //
            return timeline;
        }
        _parseMesh(rawData, mesh) {
            mesh.offset = rawData[dragonBones.DataParser.OFFSET];
            const weightOffset = this._intArrayBuffer[mesh.offset + 3 /* BinaryOffset.MeshWeightOffset */];
            if (weightOffset >= 0) {
                const weight = dragonBones.BaseObject.borrowObject(dragonBones.WeightData);
                const vertexCount = this._intArrayBuffer[mesh.offset + 0 /* BinaryOffset.MeshVertexCount */];
                const boneCount = this._intArrayBuffer[weightOffset + 0 /* BinaryOffset.WeigthBoneCount */];
                weight.offset = weightOffset;
                for (let i = 0; i < boneCount; ++i) {
                    const boneIndex = this._intArrayBuffer[weightOffset + 2 /* BinaryOffset.WeigthBoneIndices */ + i];
                    weight.addBone(this._rawBones[boneIndex]);
                }
                let boneIndicesOffset = weightOffset + 2 /* BinaryOffset.WeigthBoneIndices */ + boneCount;
                let weightCount = 0;
                for (let i = 0, l = vertexCount; i < l; ++i) {
                    const vertexBoneCount = this._intArrayBuffer[boneIndicesOffset++];
                    weightCount += vertexBoneCount;
                    boneIndicesOffset += vertexBoneCount;
                }
                weight.count = weightCount;
                mesh.weight = weight;
            }
        }
        _parseAnimation(rawData) {
            const animation = dragonBones.BaseObject.borrowObject(dragonBones.AnimationData);
            animation.frameCount = Math.max(dragonBones.ObjectDataParser._getNumber(rawData, dragonBones.DataParser.DURATION, 1), 1);
            animation.playTimes = dragonBones.ObjectDataParser._getNumber(rawData, dragonBones.DataParser.PLAY_TIMES, 1);
            animation.duration = animation.frameCount / this._armature.frameRate; // float
            animation.fadeInTime = dragonBones.ObjectDataParser._getNumber(rawData, dragonBones.DataParser.FADE_IN_TIME, 0.0);
            animation.scale = dragonBones.ObjectDataParser._getNumber(rawData, dragonBones.DataParser.SCALE, 1.0);
            animation.name = dragonBones.ObjectDataParser._getString(rawData, dragonBones.DataParser.NAME, dragonBones.DataParser.DEFAULT_NAME);
            if (animation.name.length === 0) {
                animation.name = dragonBones.DataParser.DEFAULT_NAME;
            }
            // Offsets.
            const offsets = rawData[dragonBones.DataParser.OFFSET];
            animation.frameIntOffset = offsets[0];
            animation.frameFloatOffset = offsets[1];
            animation.frameOffset = offsets[2];
            this._animation = animation;
            if (dragonBones.DataParser.ACTION in rawData) {
                animation.actionTimeline = this._parseBinaryTimeline(0 /* TimelineType.Action */, rawData[dragonBones.DataParser.ACTION]);
            }
            if (dragonBones.DataParser.Z_ORDER in rawData) {
                animation.zOrderTimeline = this._parseBinaryTimeline(1 /* TimelineType.ZOrder */, rawData[dragonBones.DataParser.Z_ORDER]);
            }
            if (dragonBones.DataParser.BONE in rawData) {
                const rawTimeliness = rawData[dragonBones.DataParser.BONE];
                for (let k in rawTimeliness) {
                    const rawTimelines = rawTimeliness[k];
                    if (dragonBones.DragonBones.webAssembly) {
                        k = this._getUTF16Key(k);
                    }
                    const bone = this._armature.getBone(k);
                    if (bone === null) {
                        continue;
                    }
                    for (let i = 0, l = rawTimelines.length; i < l; i += 2) {
                        const timelineType = rawTimelines[i];
                        const timelineOffset = rawTimelines[i + 1];
                        const timeline = this._parseBinaryTimeline(timelineType, timelineOffset);
                        this._animation.addBoneTimeline(bone, timeline);
                    }
                }
            }
            if (dragonBones.DataParser.SURFACE in rawData) {
                const rawTimeliness = rawData[dragonBones.DataParser.SURFACE];
                for (let k in rawTimeliness) {
                    const rawTimelines = rawTimeliness[k];
                    if (dragonBones.DragonBones.webAssembly) {
                        k = this._getUTF16Key(k);
                    }
                    const surface = this._armature.getBone(k);
                    if (surface === null) {
                        continue;
                    }
                    for (let i = 0, l = rawTimelines.length; i < l; i += 2) {
                        const timelineType = rawTimelines[i];
                        const timelineOffset = rawTimelines[i + 1];
                        const timeline = this._parseBinaryTimeline(timelineType, timelineOffset);
                        this._animation.addSurfaceTimeline(surface, timeline);
                    }
                }
            }
            if (dragonBones.DataParser.SLOT in rawData) {
                const rawTimeliness = rawData[dragonBones.DataParser.SLOT];
                for (let k in rawTimeliness) {
                    const rawTimelines = rawTimeliness[k];
                    if (dragonBones.DragonBones.webAssembly) {
                        k = this._getUTF16Key(k);
                    }
                    const slot = this._armature.getSlot(k);
                    if (slot === null) {
                        continue;
                    }
                    for (let i = 0, l = rawTimelines.length; i < l; i += 2) {
                        const timelineType = rawTimelines[i];
                        const timelineOffset = rawTimelines[i + 1];
                        const timeline = this._parseBinaryTimeline(timelineType, timelineOffset);
                        this._animation.addSlotTimeline(slot, timeline);
                    }
                }
            }
            if (dragonBones.DataParser.CONSTRAINT in rawData) {
                const rawTimeliness = rawData[dragonBones.DataParser.CONSTRAINT];
                for (let k in rawTimeliness) {
                    const rawTimelines = rawTimeliness[k];
                    if (dragonBones.DragonBones.webAssembly) {
                        k = this._getUTF16Key(k);
                    }
                    const constraint = this._armature.getConstraint(k);
                    if (constraint === null) {
                        continue;
                    }
                    for (let i = 0, l = rawTimelines.length; i < l; i += 2) {
                        const timelineType = rawTimelines[i];
                        const timelineOffset = rawTimelines[i + 1];
                        const timeline = this._parseBinaryTimeline(timelineType, timelineOffset);
                        this._animation.addConstraintTimeline(constraint, timeline);
                    }
                }
            }
            if (dragonBones.DataParser.ANIMATION in rawData) {
                const rawTimeliness = rawData[dragonBones.DataParser.ANIMATION];
                for (let k in rawTimeliness) {
                    const rawTimelines = rawTimeliness[k];
                    if (dragonBones.DragonBones.webAssembly) {
                        k = this._getUTF16Key(k);
                    }
                    for (let i = 0, l = rawTimelines.length; i < l; i += 2) {
                        const timelineType = rawTimelines[i];
                        const timelineOffset = rawTimelines[i + 1];
                        const timeline = this._parseBinaryTimeline(timelineType, timelineOffset);
                        this._animation.addAnimationTimeline(k, timeline);
                    }
                }
            }
            this._animation = null;
            return animation;
        }
        _parseArray(rawData) {
            const offsets = rawData[dragonBones.DataParser.OFFSET];
            const l1 = offsets[1];
            const l2 = offsets[3];
            const l3 = offsets[5];
            const l4 = offsets[7];
            const l5 = offsets[9];
            const l6 = offsets[11];
            const intArray = new Int16Array(this._binary, this._binaryOffset + offsets[0], l1 / Int16Array.BYTES_PER_ELEMENT);
            const floatArray = new Float32Array(this._binary, this._binaryOffset + offsets[2], l2 / Float32Array.BYTES_PER_ELEMENT);
            const frameIntArray = new Int16Array(this._binary, this._binaryOffset + offsets[4], l3 / Int16Array.BYTES_PER_ELEMENT);
            const frameFloatArray = new Float32Array(this._binary, this._binaryOffset + offsets[6], l4 / Float32Array.BYTES_PER_ELEMENT);
            const frameArray = new Int16Array(this._binary, this._binaryOffset + offsets[8], l5 / Int16Array.BYTES_PER_ELEMENT);
            const timelineArray = new Uint16Array(this._binary, this._binaryOffset + offsets[10], l6 / Uint16Array.BYTES_PER_ELEMENT);
            if (dragonBones.DragonBones.webAssembly) {
                const lTotal = l1 + l2 + l3 + l4 + l5 + l6;
                const bufferPointer = dragonBones.webAssemblyModule._malloc(lTotal);
                const rawArray = new Uint8Array(this._binary, this._binaryOffset, lTotal / Uint8Array.BYTES_PER_ELEMENT);
                const copyArray = new Uint8Array(dragonBones.webAssemblyModule.HEAP16.buffer, bufferPointer, rawArray.length);
                for (let i = 0, l = rawArray.length; i < l; ++i) {
                    copyArray[i] = rawArray[i];
                }
                dragonBones.webAssemblyModule.setDataBinary(this._data, bufferPointer, l1, l2, l3, l4, l5, l6);
                this._intArrayBuffer = intArray;
                this._floatArrayBuffer = floatArray;
                this._frameIntArrayBuffer = frameIntArray;
                this._frameFloatArrayBuffer = frameFloatArray;
                this._frameArrayBuffer = frameArray;
                this._timelineArrayBuffer = timelineArray;
            }
            else {
                this._data.binary = this._binary;
                this._data.intArray = this._intArrayBuffer = intArray;
                this._data.floatArray = this._floatArrayBuffer = floatArray;
                this._data.frameIntArray = this._frameIntArrayBuffer = frameIntArray;
                this._data.frameFloatArray = this._frameFloatArrayBuffer = frameFloatArray;
                this._data.frameArray = this._frameArrayBuffer = frameArray;
                this._data.timelineArray = this._timelineArrayBuffer = timelineArray;
            }
        }
        parseDragonBonesData(rawData, scale = 1) {
            console.assert(rawData !== null && rawData !== undefined && rawData instanceof ArrayBuffer, "Data error.");
            const tag = new Uint8Array(rawData, 0, 8);
            if (tag[0] !== "D".charCodeAt(0) ||
                tag[1] !== "B".charCodeAt(0) ||
                tag[2] !== "D".charCodeAt(0) ||
                tag[3] !== "T".charCodeAt(0)) {
                console.assert(false, "Nonsupport data.");
                return null;
            }
            const headerLength = new Uint32Array(rawData, 8, 1)[0];
            const headerBytes = new Uint8Array(rawData, 8 + 4, headerLength);
            const headerString = this._decodeUTF8(headerBytes);
            const header = JSON.parse(headerString);
            //
            this._binaryOffset = 8 + 4 + headerLength;
            this._binary = rawData;
            return super.parseDragonBonesData(header, scale);
        }
        /**
         * - Deprecated, please refer to {@link dragonBones.BaseFactory#parseDragonBonesData()}.
         * @deprecated
         * @language en_US
         */
        /**
         * - 已废弃，请参考 {@link dragonBones.BaseFactory#parseDragonBonesData()}。
         * @deprecated
         * @language zh_CN
         */
        static getInstance() {
            if (BinaryDataParser._binaryDataParserInstance === null) {
                BinaryDataParser._binaryDataParserInstance = new BinaryDataParser();
            }
            return BinaryDataParser._binaryDataParserInstance;
        }
    }
    BinaryDataParser._binaryDataParserInstance = null;
    dragonBones.BinaryDataParser = BinaryDataParser;
})(dragonBones || (dragonBones = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var dragonBones;
(function (dragonBones) {
    /**
     * - Base class for the factory that create the armatures. (Typically only one global factory instance is required)
     * The factory instance create armatures by parsed and added DragonBonesData instances and TextureAtlasData instances.
     * Once the data has been parsed, it has been cached in the factory instance and does not need to be parsed again until it is cleared by the factory instance.
     * @see dragonBones.DragonBonesData
     * @see dragonBones.TextureAtlasData
     * @see dragonBones.ArmatureData
     * @see dragonBones.Armature
     * @version DragonBones 3.0
     * @language en_US
     */
    /**
     * - 创建骨架的工厂基类。 （通常只需要一个全局工厂实例）
     * 工厂通过解析并添加的 DragonBonesData 实例和 TextureAtlasData 实例来创建骨架。
     * 当数据被解析过之后，已经添加到工厂中，在没有被工厂清理之前，不需要再次解析。
     * @see dragonBones.DragonBonesData
     * @see dragonBones.TextureAtlasData
     * @see dragonBones.ArmatureData
     * @see dragonBones.Armature
     * @version DragonBones 3.0
     * @language zh_CN
     */
    class BaseFactory {
        /**
         * - Create a factory instance. (typically only one global factory instance is required)
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 创建一个工厂实例。 （通常只需要一个全局工厂实例）
         * @version DragonBones 3.0
         * @language zh_CN
         */
        constructor(dataParser = null) {
            /**
             * @private
             */
            this.autoSearch = false;
            /**
             * @private
             */
            this._dragonBonesDataMap = {};
            /**
             * @private
             */
            this._textureAtlasDataMap = {};
            /**
             * @private
             */
            this._dragonBones = null;
            /**
             * @private
             */
            this._dataParser = null;
            if (BaseFactory._objectParser === null) {
                BaseFactory._objectParser = new dragonBones.ObjectDataParser();
            }
            if (BaseFactory._binaryParser === null) {
                BaseFactory._binaryParser = new dragonBones.BinaryDataParser();
            }
            this._dataParser = dataParser !== null ? dataParser : BaseFactory._objectParser;
        }
        /**
         * @private
         */
        _isSupportMesh() {
            return true;
        }
        /**
         * @private
         */
        _getTextureData(textureAtlasName, textureName) {
            if (textureAtlasName in this._textureAtlasDataMap) {
                for (const textureAtlasData of this._textureAtlasDataMap[textureAtlasName]) {
                    const textureData = textureAtlasData.getTexture(textureName);
                    if (textureData !== null) {
                        return textureData;
                    }
                }
            }
            if (this.autoSearch) { // Will be search all data, if the autoSearch is true.
                for (let k in this._textureAtlasDataMap) {
                    for (const textureAtlasData of this._textureAtlasDataMap[k]) {
                        if (textureAtlasData.autoSearch) {
                            const textureData = textureAtlasData.getTexture(textureName);
                            if (textureData !== null) {
                                return textureData;
                            }
                        }
                    }
                }
            }
            return null;
        }
        /**
         * @private
         */
        _fillBuildArmaturePackage(dataPackage, dragonBonesName, armatureName, skinName, textureAtlasName) {
            let dragonBonesData = null;
            let armatureData = null;
            if (dragonBonesName.length > 0) {
                if (dragonBonesName in this._dragonBonesDataMap) {
                    dragonBonesData = this._dragonBonesDataMap[dragonBonesName];
                    armatureData = dragonBonesData.getArmature(armatureName);
                }
            }
            if (armatureData === null && (dragonBonesName.length === 0 || this.autoSearch)) { // Will be search all data, if do not give a data name or the autoSearch is true.
                for (let k in this._dragonBonesDataMap) {
                    dragonBonesData = this._dragonBonesDataMap[k];
                    if (dragonBonesName.length === 0 || dragonBonesData.autoSearch) {
                        armatureData = dragonBonesData.getArmature(armatureName);
                        if (armatureData !== null) {
                            dragonBonesName = k;
                            break;
                        }
                    }
                }
            }
            if (armatureData !== null) {
                dataPackage.dataName = dragonBonesName;
                dataPackage.textureAtlasName = textureAtlasName;
                dataPackage.data = dragonBonesData;
                dataPackage.armature = armatureData;
                dataPackage.skin = null;
                if (skinName.length > 0) {
                    dataPackage.skin = armatureData.getSkin(skinName);
                    if (dataPackage.skin === null && this.autoSearch) {
                        for (let k in this._dragonBonesDataMap) {
                            const skinDragonBonesData = this._dragonBonesDataMap[k];
                            const skinArmatureData = skinDragonBonesData.getArmature(skinName);
                            if (skinArmatureData !== null) {
                                dataPackage.skin = skinArmatureData.defaultSkin;
                                break;
                            }
                        }
                    }
                }
                if (dataPackage.skin === null) {
                    dataPackage.skin = armatureData.defaultSkin;
                }
                return true;
            }
            return false;
        }
        /**
         * @private
         */
        _buildBones(dataPackage, armature) {
            for (const boneData of dataPackage.armature.sortedBones) {
                const bone = dragonBones.BaseObject.borrowObject(boneData.type === 0 /* BoneType.Bone */ ? dragonBones.Bone : dragonBones.Surface);
                bone.init(boneData);
                if (boneData.parent !== null) {
                    armature.addBone(bone, boneData.parent.name);
                }
                else {
                    armature.addBone(bone, "");
                }
            }
            const constraints = dataPackage.armature.constraints;
            for (let k in constraints) {
                const constraintData = constraints[k];
                // TODO more constraint type.
                const constraint = dragonBones.BaseObject.borrowObject(dragonBones.IKConstraint);
                constraint.init(constraintData, armature);
                armature.addConstraint(constraint);
            }
        }
        /**
         * @private
         */
        _buildSlots(dataPackage, armature) {
            const currentSkin = dataPackage.skin;
            const defaultSkin = dataPackage.armature.defaultSkin;
            if (currentSkin === null || defaultSkin === null) {
                return;
            }
            const skinSlots = {};
            for (let k in defaultSkin.displays) {
                const displays = defaultSkin.getDisplays(k);
                skinSlots[k] = displays;
            }
            if (currentSkin !== defaultSkin) {
                for (let k in currentSkin.displays) {
                    const displays = currentSkin.getDisplays(k);
                    skinSlots[k] = displays;
                }
            }
            for (const slotData of dataPackage.armature.sortedSlots) {
                const displays = slotData.name in skinSlots ? skinSlots[slotData.name] : null;
                const slot = this._buildSlot(dataPackage, slotData, displays, armature);
                armature.addSlot(slot, slotData.parent.name);
                if (displays !== null) {
                    const displayList = new Array();
                    // for (const displayData of displays) 
                    for (let i = 0, l = dragonBones.DragonBones.webAssembly ? displays.size() : displays.length; i < l; ++i) {
                        const displayData = dragonBones.DragonBones.webAssembly ? displays.get(i) : displays[i];
                        if (displayData !== null) {
                            displayList.push(this._getSlotDisplay(dataPackage, displayData, null, slot));
                        }
                        else {
                            displayList.push(null);
                        }
                    }
                    slot._setDisplayList(displayList);
                }
                slot._setDisplayIndex(slotData.displayIndex, true);
            }
        }
        /**
         * @private
         */
        _buildChildArmature(dataPackage, slot, displayData) {
            // tslint:disable-next-line:no-unused-expression
            slot;
            return this.buildArmature(displayData.path, dataPackage !== null ? dataPackage.dataName : "", "", dataPackage !== null ? dataPackage.textureAtlasName : "");
        }
        /**
         * @private
         */
        _getSlotDisplay(dataPackage, displayData, rawDisplayData, slot) {
            const dataName = dataPackage !== null ? dataPackage.dataName : displayData.parent.parent.parent.name;
            let display = null;
            switch (displayData.type) {
                case 0 /* DisplayType.Image */: {
                    const imageDisplayData = displayData;
                    if (imageDisplayData.texture === null) {
                        imageDisplayData.texture = this._getTextureData(dataName, displayData.path);
                    }
                    else if (dataPackage !== null && dataPackage.textureAtlasName.length > 0) {
                        imageDisplayData.texture = this._getTextureData(dataPackage.textureAtlasName, displayData.path);
                    }
                    if (rawDisplayData !== null && rawDisplayData.type === 2 /* DisplayType.Mesh */ && this._isSupportMesh()) {
                        display = slot.meshDisplay;
                    }
                    else {
                        display = slot.rawDisplay;
                    }
                    break;
                }
                case 2 /* DisplayType.Mesh */: {
                    const meshDisplayData = displayData;
                    if (meshDisplayData.texture === null) {
                        meshDisplayData.texture = this._getTextureData(dataName, meshDisplayData.path);
                    }
                    else if (dataPackage !== null && dataPackage.textureAtlasName.length > 0) {
                        meshDisplayData.texture = this._getTextureData(dataPackage.textureAtlasName, meshDisplayData.path);
                    }
                    if (this._isSupportMesh()) {
                        display = slot.meshDisplay;
                    }
                    else {
                        display = slot.rawDisplay;
                    }
                    break;
                }
                case 1 /* DisplayType.Armature */: {
                    const armatureDisplayData = displayData;
                    const childArmature = this._buildChildArmature(dataPackage, slot, displayData);
                    if (childArmature !== null) {
                        childArmature.inheritAnimation = armatureDisplayData.inheritAnimation;
                        if (!childArmature.inheritAnimation) {
                            const actions = armatureDisplayData.actions.length > 0 ? armatureDisplayData.actions : childArmature.armatureData.defaultActions;
                            if (actions.length > 0) {
                                for (const action of actions) {
                                    childArmature._bufferAction(action, true);
                                }
                            }
                            else {
                                childArmature.animation.play();
                            }
                        }
                        armatureDisplayData.armature = childArmature.armatureData; // 
                    }
                    display = childArmature;
                    break;
                }
                case 3 /* DisplayType.BoundingBox */:
                    break;
                default:
                    break;
            }
            return display;
        }
        /**
         * - Parse the raw data to a DragonBonesData instance and cache it to the factory.
         * @param rawData - The raw data.
         * @param name - Specify a cache name for the instance so that the instance can be obtained through this name. (If not set, use the instance name instead)
         * @param scale - Specify a scaling value for all armatures. (Default: 1.0)
         * @returns DragonBonesData instance
         * @see #getDragonBonesData()
         * @see #addDragonBonesData()
         * @see #removeDragonBonesData()
         * @see dragonBones.DragonBonesData
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 将原始数据解析为 DragonBonesData 实例，并缓存到工厂中。
         * @param rawData - 原始数据。
         * @param name - 为该实例指定一个缓存名称，以便可以通过此名称获取该实例。 （如果未设置，则使用该实例中的名称）
         * @param scale - 为所有的骨架指定一个缩放值。 （默认: 1.0）
         * @returns DragonBonesData 实例
         * @see #getDragonBonesData()
         * @see #addDragonBonesData()
         * @see #removeDragonBonesData()
         * @see dragonBones.DragonBonesData
         * @version DragonBones 4.5
         * @language zh_CN
         */
        parseDragonBonesData(rawData, name = null, scale = 1.0) {
            const dataParser = rawData instanceof ArrayBuffer ? BaseFactory._binaryParser : this._dataParser;
            const dragonBonesData = dataParser.parseDragonBonesData(rawData, scale);
            while (true) {
                const textureAtlasData = this._buildTextureAtlasData(null, null);
                if (dataParser.parseTextureAtlasData(null, textureAtlasData, scale)) {
                    this.addTextureAtlasData(textureAtlasData, name);
                }
                else {
                    textureAtlasData.returnToPool();
                    break;
                }
            }
            if (dragonBonesData !== null) {
                this.addDragonBonesData(dragonBonesData, name);
            }
            return dragonBonesData;
        }
        /**
         * - Parse the raw texture atlas data and the texture atlas object to a TextureAtlasData instance and cache it to the factory.
         * @param rawData - The raw texture atlas data.
         * @param textureAtlas - The texture atlas object.
         * @param name - Specify a cache name for the instance so that the instance can be obtained through this name. (If not set, use the instance name instead)
         * @param scale - Specify a scaling value for the map set. (Default: 1.0)
         * @returns TextureAtlasData instance
         * @see #getTextureAtlasData()
         * @see #addTextureAtlasData()
         * @see #removeTextureAtlasData()
         * @see dragonBones.TextureAtlasData
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 将原始贴图集数据和贴图集对象解析为 TextureAtlasData 实例，并缓存到工厂中。
         * @param rawData - 原始贴图集数据。
         * @param textureAtlas - 贴图集对象。
         * @param name - 为该实例指定一个缓存名称，以便可以通过此名称获取该实例。 （如果未设置，则使用该实例中的名称）
         * @param scale - 为贴图集指定一个缩放值。 （默认: 1.0）
         * @returns TextureAtlasData 实例
         * @see #getTextureAtlasData()
         * @see #addTextureAtlasData()
         * @see #removeTextureAtlasData()
         * @see dragonBones.TextureAtlasData
         * @version DragonBones 4.5
         * @language zh_CN
         */
        parseTextureAtlasData(rawData, textureAtlas, name = null, scale = 1.0) {
            const textureAtlasData = this._buildTextureAtlasData(null, null);
            this._dataParser.parseTextureAtlasData(rawData, textureAtlasData, scale);
            this._buildTextureAtlasData(textureAtlasData, textureAtlas || null);
            this.addTextureAtlasData(textureAtlasData, name);
            return textureAtlasData;
        }
        /**
         * @private
         */
        updateTextureAtlasData(name, textureAtlases) {
            const textureAtlasDatas = this.getTextureAtlasData(name);
            if (textureAtlasDatas !== null) {
                for (let i = 0, l = textureAtlasDatas.length; i < l; ++i) {
                    if (i < textureAtlases.length) {
                        this._buildTextureAtlasData(textureAtlasDatas[i], textureAtlases[i]);
                    }
                }
            }
        }
        /**
         * - Get a specific DragonBonesData instance.
         * @param name - The DragonBonesData instance cache name.
         * @returns DragonBonesData instance
         * @see #parseDragonBonesData()
         * @see #addDragonBonesData()
         * @see #removeDragonBonesData()
         * @see dragonBones.DragonBonesData
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 获取特定的 DragonBonesData 实例。
         * @param name - DragonBonesData 实例的缓存名称。
         * @returns DragonBonesData 实例
         * @see #parseDragonBonesData()
         * @see #addDragonBonesData()
         * @see #removeDragonBonesData()
         * @see dragonBones.DragonBonesData
         * @version DragonBones 3.0
         * @language zh_CN
         */
        getDragonBonesData(name) {
            return (name in this._dragonBonesDataMap) ? this._dragonBonesDataMap[name] : null;
        }
        /**
         * - Cache a DragonBonesData instance to the factory.
         * @param data - The DragonBonesData instance.
         * @param name - Specify a cache name for the instance so that the instance can be obtained through this name. (if not set, use the instance name instead)
         * @see #parseDragonBonesData()
         * @see #getDragonBonesData()
         * @see #removeDragonBonesData()
         * @see dragonBones.DragonBonesData
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 将 DragonBonesData 实例缓存到工厂中。
         * @param data - DragonBonesData 实例。
         * @param name - 为该实例指定一个缓存名称，以便可以通过此名称获取该实例。 （如果未设置，则使用该实例中的名称）
         * @see #parseDragonBonesData()
         * @see #getDragonBonesData()
         * @see #removeDragonBonesData()
         * @see dragonBones.DragonBonesData
         * @version DragonBones 3.0
         * @language zh_CN
         */
        addDragonBonesData(data, name = null) {
            name = name !== null ? name : data.name;
            if (name in this._dragonBonesDataMap) {
                if (this._dragonBonesDataMap[name] === data) {
                    return;
                }
                console.warn("Can not add same name data: " + name);
                return;
            }
            this._dragonBonesDataMap[name] = data;
        }
        /**
         * - Remove a DragonBonesData instance.
         * @param name - The DragonBonesData instance cache name.
         * @param disposeData - Whether to dispose data. (Default: true)
         * @see #parseDragonBonesData()
         * @see #getDragonBonesData()
         * @see #addDragonBonesData()
         * @see dragonBones.DragonBonesData
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 移除 DragonBonesData 实例。
         * @param name - DragonBonesData 实例缓存名称。
         * @param disposeData - 是否释放数据。 （默认: true）
         * @see #parseDragonBonesData()
         * @see #getDragonBonesData()
         * @see #addDragonBonesData()
         * @see dragonBones.DragonBonesData
         * @version DragonBones 3.0
         * @language zh_CN
         */
        removeDragonBonesData(name, disposeData = true) {
            if (name in this._dragonBonesDataMap) {
                if (disposeData) {
                    this._dragonBones.bufferObject(this._dragonBonesDataMap[name]);
                }
                delete this._dragonBonesDataMap[name];
            }
        }
        /**
         * - Get a list of specific TextureAtlasData instances.
         * @param name - The TextureAtlasData cahce name.
         * @see #parseTextureAtlasData()
         * @see #addTextureAtlasData()
         * @see #removeTextureAtlasData()
         * @see dragonBones.TextureAtlasData
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 获取特定的 TextureAtlasData 实例列表。
         * @param name - TextureAtlasData 实例缓存名称。
         * @see #parseTextureAtlasData()
         * @see #addTextureAtlasData()
         * @see #removeTextureAtlasData()
         * @see dragonBones.TextureAtlasData
         * @version DragonBones 3.0
         * @language zh_CN
         */
        getTextureAtlasData(name) {
            return (name in this._textureAtlasDataMap) ? this._textureAtlasDataMap[name] : null;
        }
        /**
         * - Cache a TextureAtlasData instance to the factory.
         * @param data - The TextureAtlasData instance.
         * @param name - Specify a cache name for the instance so that the instance can be obtained through this name. (if not set, use the instance name instead)
         * @see #parseTextureAtlasData()
         * @see #getTextureAtlasData()
         * @see #removeTextureAtlasData()
         * @see dragonBones.TextureAtlasData
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 将 TextureAtlasData 实例缓存到工厂中。
         * @param data - TextureAtlasData 实例。
         * @param name - 为该实例指定一个缓存名称，以便可以通过此名称获取该实例。 （如果未设置，则使用该实例中的名称）
         * @see #parseTextureAtlasData()
         * @see #getTextureAtlasData()
         * @see #removeTextureAtlasData()
         * @see dragonBones.TextureAtlasData
         * @version DragonBones 3.0
         * @language zh_CN
         */
        addTextureAtlasData(data, name = null) {
            name = name !== null ? name : data.name;
            const textureAtlasList = (name in this._textureAtlasDataMap) ? this._textureAtlasDataMap[name] : (this._textureAtlasDataMap[name] = []);
            if (textureAtlasList.indexOf(data) < 0) {
                textureAtlasList.push(data);
            }
        }
        /**
         * - Remove a TextureAtlasData instance.
         * @param name - The TextureAtlasData instance cache name.
         * @param disposeData - Whether to dispose data.
         * @see #parseTextureAtlasData()
         * @see #getTextureAtlasData()
         * @see #addTextureAtlasData()
         * @see dragonBones.TextureAtlasData
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 移除 TextureAtlasData 实例。
         * @param name - TextureAtlasData 实例的缓存名称。
         * @param disposeData - 是否释放数据。
         * @see #parseTextureAtlasData()
         * @see #getTextureAtlasData()
         * @see #addTextureAtlasData()
         * @see dragonBones.TextureAtlasData
         * @version DragonBones 3.0
         * @language zh_CN
         */
        removeTextureAtlasData(name, disposeData = true) {
            if (name in this._textureAtlasDataMap) {
                const textureAtlasDataList = this._textureAtlasDataMap[name];
                if (disposeData) {
                    for (const textureAtlasData of textureAtlasDataList) {
                        this._dragonBones.bufferObject(textureAtlasData);
                    }
                }
                delete this._textureAtlasDataMap[name];
            }
        }
        /**
         * - Get a specific armature data.
         * @param name - The armature data name.
         * @param dragonBonesName - The cached name for DragonbonesData instance.
         * @see dragonBones.ArmatureData
         * @version DragonBones 5.1
         * @language en_US
         */
        /**
         * - 获取特定的骨架数据。
         * @param name - 骨架数据名称。
         * @param dragonBonesName - DragonBonesData 实例的缓存名称。
         * @see dragonBones.ArmatureData
         * @version DragonBones 5.1
         * @language zh_CN
         */
        getArmatureData(name, dragonBonesName = "") {
            const dataPackage = new BuildArmaturePackage();
            if (!this._fillBuildArmaturePackage(dataPackage, dragonBonesName, name, "", "")) {
                return null;
            }
            return dataPackage.armature;
        }
        /**
         * - Clear all cached DragonBonesData instances and TextureAtlasData instances.
         * @param disposeData - Whether to dispose data.
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 清除缓存的所有 DragonBonesData 实例和 TextureAtlasData 实例。
         * @param disposeData - 是否释放数据。
         * @version DragonBones 4.5
         * @language zh_CN
         */
        clear(disposeData = true) {
            for (let k in this._dragonBonesDataMap) {
                if (disposeData) {
                    this._dragonBones.bufferObject(this._dragonBonesDataMap[k]);
                }
                delete this._dragonBonesDataMap[k];
            }
            for (let k in this._textureAtlasDataMap) {
                if (disposeData) {
                    const textureAtlasDataList = this._textureAtlasDataMap[k];
                    for (const textureAtlasData of textureAtlasDataList) {
                        this._dragonBones.bufferObject(textureAtlasData);
                    }
                }
                delete this._textureAtlasDataMap[k];
            }
        }
        /**
         * - Create a armature from cached DragonBonesData instances and TextureAtlasData instances.
         * Note that when the created armature that is no longer in use, you need to explicitly dispose {@link #dragonBones.Armature#dispose()}.
         * @param armatureName - The armature data name.
         * @param dragonBonesName - The cached name of the DragonBonesData instance. (If not set, all DragonBonesData instances are retrieved, and when multiple DragonBonesData instances contain a the same name armature data, it may not be possible to accurately create a specific armature)
         * @param skinName - The skin name, you can set a different ArmatureData name to share it's skin data. (If not set, use the default skin data)
         * @returns The armature.
         * @example
         * <pre>
         *     let armature = factory.buildArmature("armatureName", "dragonBonesName");
         *     armature.clock = factory.clock;
         * </pre>
         * @see dragonBones.DragonBonesData
         * @see dragonBones.ArmatureData
         * @version DragonBones 3.0
         * @language en_US
         */
        /**
         * - 通过缓存的 DragonBonesData 实例和 TextureAtlasData 实例创建一个骨架。
         * 注意，创建的骨架不再使用时，需要显式释放 {@link #dragonBones.Armature#dispose()}。
         * @param armatureName - 骨架数据名称。
         * @param dragonBonesName - DragonBonesData 实例的缓存名称。 （如果未设置，将检索所有的 DragonBonesData 实例，当多个 DragonBonesData 实例中包含同名的骨架数据时，可能无法准确的创建出特定的骨架）
         * @param skinName - 皮肤名称，可以设置一个其他骨架数据名称来共享其皮肤数据（如果未设置，则使用默认的皮肤数据）。
         * @returns 骨架。
         * @example
         * <pre>
         *     let armature = factory.buildArmature("armatureName", "dragonBonesName");
         *     armature.clock = factory.clock;
         * </pre>
         * @see dragonBones.DragonBonesData
         * @see dragonBones.ArmatureData
         * @version DragonBones 3.0
         * @language zh_CN
         */
        buildArmature(armatureName, dragonBonesName = "", skinName = "", textureAtlasName = "") {
            const dataPackage = new BuildArmaturePackage();
            if (!this._fillBuildArmaturePackage(dataPackage, dragonBonesName || "", armatureName, skinName || "", textureAtlasName || "")) {
                console.warn("No armature data: " + armatureName + ", " + (dragonBonesName !== null ? dragonBonesName : ""));
                return null;
            }
            const armature = this._buildArmature(dataPackage);
            this._buildBones(dataPackage, armature);
            this._buildSlots(dataPackage, armature);
            armature.invalidUpdate(null, true);
            armature.advanceTime(0.0); // Update armature pose.
            return armature;
        }
        /**
         * @private
         */
        replaceDisplay(slot, displayData, displayIndex = -1) {
            if (displayIndex < 0) {
                displayIndex = slot.displayIndex;
            }
            if (displayIndex < 0) {
                displayIndex = 0;
            }
            slot.replaceDisplayData(displayData, displayIndex);
            const displayList = slot.displayList; // Copy.
            if (displayList.length <= displayIndex) {
                displayList.length = displayIndex + 1;
                for (let i = 0, l = displayList.length; i < l; ++i) { // Clean undefined.
                    if (!displayList[i]) {
                        displayList[i] = null;
                    }
                }
            }
            if (displayData !== null) {
                const rawDisplayDatas = slot.rawDisplayDatas;
                let rawDisplayData = null;
                if (rawDisplayDatas) {
                    if (dragonBones.DragonBones.webAssembly) {
                        if (displayIndex < rawDisplayDatas.size()) {
                            rawDisplayData = rawDisplayDatas.get(displayIndex);
                        }
                    }
                    else {
                        if (displayIndex < rawDisplayDatas.length) {
                            rawDisplayData = rawDisplayDatas[displayIndex];
                        }
                    }
                }
                displayList[displayIndex] = this._getSlotDisplay(null, displayData, rawDisplayData, slot);
            }
            else {
                displayList[displayIndex] = null;
            }
            slot.displayList = displayList;
        }
        /**
         * - Replaces the current display data for a particular slot with a specific display data.
         * Specify display data with "dragonBonesName/armatureName/slotName/displayName".
         * @param dragonBonesName - The DragonBonesData instance cache name.
         * @param armatureName - The armature data name.
         * @param slotName - The slot data name.
         * @param displayName - The display data name.
         * @param slot - The slot.
         * @param displayIndex - The index of the display data that is replaced. (If it is not set, replaces the current display data)
         * @example
         * <pre>
         *     let slot = armature.getSlot("weapon");
         *     factory.replaceSlotDisplay("dragonBonesName", "armatureName", "slotName", "displayName", slot);
         * </pre>
         * @version DragonBones 4.5
         * @language en_US
         */
        /**
         * - 用特定的显示对象数据替换特定插槽当前的显示对象数据。
         * 用 "dragonBonesName/armatureName/slotName/displayName" 指定显示对象数据。
         * @param dragonBonesName - DragonBonesData 实例的缓存名称。
         * @param armatureName - 骨架数据名称。
         * @param slotName - 插槽数据名称。
         * @param displayName - 显示对象数据名称。
         * @param slot - 插槽。
         * @param displayIndex - 被替换的显示对象数据的索引。 （如果未设置，则替换当前的显示对象数据）
         * @example
         * <pre>
         *     let slot = armature.getSlot("weapon");
         *     factory.replaceSlotDisplay("dragonBonesName", "armatureName", "slotName", "displayName", slot);
         * </pre>
         * @version DragonBones 4.5
         * @language zh_CN
         */
        replaceSlotDisplay(dragonBonesName, armatureName, slotName, displayName, slot, displayIndex = -1) {
            const armatureData = this.getArmatureData(armatureName, dragonBonesName || "");
            if (!armatureData || !armatureData.defaultSkin) {
                return false;
            }
            const displayData = armatureData.defaultSkin.getDisplay(slotName, displayName);
            if (!displayData) {
                return false;
            }
            this.replaceDisplay(slot, displayData, displayIndex);
            return true;
        }
        /**
         * @private
         */
        replaceSlotDisplayList(dragonBonesName, armatureName, slotName, slot) {
            const armatureData = this.getArmatureData(armatureName, dragonBonesName || "");
            if (!armatureData || !armatureData.defaultSkin) {
                return false;
            }
            const displays = armatureData.defaultSkin.getDisplays(slotName);
            if (!displays) {
                return false;
            }
            let displayIndex = 0;
            // for (const displayData of displays) 
            for (let i = 0, l = dragonBones.DragonBones.webAssembly ? displays.size() : displays.length; i < l; ++i) {
                const displayData = dragonBones.DragonBones.webAssembly ? displays.get(i) : displays[i];
                this.replaceDisplay(slot, displayData, displayIndex++);
            }
            return true;
        }
        /**
         * - Share specific skin data with specific armature.
         * @param armature - The armature.
         * @param skin - The skin data.
         * @param isOverride - Whether it completely override the original skin. (Default: false)
         * @param exclude - A list of slot names that do not need to be replace.
         * @example
         * <pre>
         *     let armatureA = factory.buildArmature("armatureA", "dragonBonesA");
         *     let armatureDataB = factory.getArmatureData("armatureB", "dragonBonesB");
         *     if (armatureDataB && armatureDataB.defaultSkin) {
         *     factory.replaceSkin(armatureA, armatureDataB.defaultSkin, false, ["arm_l", "weapon_l"]);
         *     }
         * </pre>
         * @see dragonBones.Armature
         * @see dragonBones.SkinData
         * @version DragonBones 5.6
         * @language en_US
         */
        /**
         * - 将特定的皮肤数据共享给特定的骨架使用。
         * @param armature - 骨架。
         * @param skin - 皮肤数据。
         * @param isOverride - 是否完全覆盖原来的皮肤。 （默认: false）
         * @param exclude - 不需要被替换的插槽名称列表。
         * @example
         * <pre>
         *     let armatureA = factory.buildArmature("armatureA", "dragonBonesA");
         *     let armatureDataB = factory.getArmatureData("armatureB", "dragonBonesB");
         *     if (armatureDataB && armatureDataB.defaultSkin) {
         *     factory.replaceSkin(armatureA, armatureDataB.defaultSkin, false, ["arm_l", "weapon_l"]);
         *     }
         * </pre>
         * @see dragonBones.Armature
         * @see dragonBones.SkinData
         * @version DragonBones 5.6
         * @language zh_CN
         */
        replaceSkin(armature, skin, isOverride = false, exclude = null) {
            let success = false;
            const defaultSkin = skin.parent.defaultSkin;
            for (const slot of armature.getSlots()) {
                if (exclude !== null && exclude.indexOf(slot.name) >= 0) {
                    continue;
                }
                let displays = skin.getDisplays(slot.name);
                if (!displays) {
                    if (defaultSkin !== null && skin !== defaultSkin) {
                        displays = defaultSkin.getDisplays(slot.name);
                    }
                    if (!displays) {
                        if (isOverride) {
                            slot.rawDisplayDatas = null;
                            slot.displayList = []; //
                        }
                        continue;
                    }
                }
                const displayCount = dragonBones.DragonBones.webAssembly ? displays.size() : displays.length;
                const displayList = slot.displayList; // Copy.
                displayList.length = displayCount; // Modify displayList length.
                for (let i = 0, l = displayCount; i < l; ++i) {
                    const displayData = dragonBones.DragonBones.webAssembly ? displays.get(i) : displays[i];
                    if (displayData !== null) {
                        displayList[i] = this._getSlotDisplay(null, displayData, null, slot);
                    }
                    else {
                        displayList[i] = null;
                    }
                }
                success = true;
                slot.rawDisplayDatas = displays;
                slot.displayList = displayList;
            }
            return success;
        }
        /**
         * - Replaces the existing animation data for a specific armature with the animation data for the specific armature data.
         * This enables you to make a armature template so that other armature without animations can share it's animations.
         * @param armature - The armtaure.
         * @param armatureData - The armature data.
         * @param isOverride - Whether to completely overwrite the original animation. (Default: false)
         * @example
         * <pre>
         *     let armatureA = factory.buildArmature("armatureA", "dragonBonesA");
         *     let armatureDataB = factory.getArmatureData("armatureB", "dragonBonesB");
         *     if (armatureDataB) {
         *     factory.replaceAnimation(armatureA, armatureDataB);
         *     }
         * </pre>
         * @see dragonBones.Armature
         * @see dragonBones.ArmatureData
         * @version DragonBones 5.6
         * @language en_US
         */
        /**
         * - 用特定骨架数据的动画数据替换特定骨架现有的动画数据。
         * 这样就能实现制作一个骨架动画模板，让其他没有制作动画的骨架共享该动画。
         * @param armature - 骨架。
         * @param armatureData - 骨架数据。
         * @param isOverride - 是否完全覆盖原来的动画。（默认: false）。
         * @example
         * <pre>
         *     let armatureA = factory.buildArmature("armatureA", "dragonBonesA");
         *     let armatureDataB = factory.getArmatureData("armatureB", "dragonBonesB");
         *     if (armatureDataB) {
         *     factory.replaceAnimation(armatureA, armatureDataB);
         *     }
         * </pre>
         * @see dragonBones.Armature
         * @see dragonBones.ArmatureData
         * @version DragonBones 5.6
         * @language zh_CN
         */
        replaceAnimation(armature, armatureData, isOverride = true) {
            const skinData = armatureData.defaultSkin;
            if (skinData === null) {
                return false;
            }
            if (isOverride) {
                armature.animation.animations = armatureData.animations;
            }
            else {
                const rawAnimations = armature.animation.animations;
                const animations = {};
                for (let k in rawAnimations) {
                    animations[k] = rawAnimations[k];
                }
                for (let k in armatureData.animations) {
                    animations[k] = armatureData.animations[k];
                }
                armature.animation.animations = animations;
            }
            for (const slot of armature.getSlots()) {
                let index = 0;
                for (const display of slot.displayList) {
                    if (display instanceof dragonBones.Armature) {
                        const displayDatas = skinData.getDisplays(slot.name);
                        if (displayDatas !== null && index < (dragonBones.DragonBones.webAssembly ? displayDatas.size() : displayDatas.length)) {
                            const displayData = dragonBones.DragonBones.webAssembly ? displayDatas.get(index) : displayDatas[index];
                            if (displayData !== null && displayData.type === 1 /* DisplayType.Armature */) {
                                const childArmatureData = this.getArmatureData(displayData.path, displayData.parent.parent.parent.name);
                                if (childArmatureData) {
                                    this.replaceAnimation(display, childArmatureData, isOverride);
                                }
                            }
                        }
                    }
                    index++;
                }
            }
            return true;
        }
        /**
         * @private
         */
        getAllDragonBonesData() {
            return this._dragonBonesDataMap;
        }
        /**
         * @private
         */
        getAllTextureAtlasData() {
            return this._textureAtlasDataMap;
        }
        /**
         * - An Worldclock instance updated by engine.
         * @version DragonBones 5.7
         * @language en_US
         */
        /**
         * - 由引擎驱动的 WorldClock 实例。
         * @version DragonBones 5.7
         * @language zh_CN
         */
        get clock() {
            return this._dragonBones.clock;
        }
        /**
         * @private
         */
        get dragonBones() {
            return this._dragonBones;
        }
        /**
         * - Deprecated, please refer to {@link #replaceSkin}.
         * @deprecated
         * @language en_US
         */
        /**
         * - 已废弃，请参考 {@link #replaceSkin}。
         * @deprecated
         * @language zh_CN
         */
        changeSkin(armature, skin, exclude = null) {
            return this.replaceSkin(armature, skin, false, exclude);
        }
        /**
         * - Deprecated, please refer to {@link #replaceAnimation}.
         * @deprecated
         * @language en_US
         */
        /**
         * - 已废弃，请参考 {@link #replaceAnimation}。
         * @deprecated
         * @language zh_CN
         */
        copyAnimationsToArmature(toArmature, fromArmatreName, fromSkinName = "", fromDragonBonesDataName = "", replaceOriginalAnimation = true) {
            // tslint:disable-next-line:no-unused-expression
            fromSkinName;
            const armatureData = this.getArmatureData(fromArmatreName, fromDragonBonesDataName);
            if (!armatureData) {
                return false;
            }
            return this.replaceAnimation(toArmature, armatureData, replaceOriginalAnimation);
        }
    }
    /**
     * @private
     */
    BaseFactory._objectParser = null;
    /**
     * @private
     */
    BaseFactory._binaryParser = null;
    dragonBones.BaseFactory = BaseFactory;
    /**
     * @internal
     * @private
     */
    class BuildArmaturePackage {
        constructor() {
            this.dataName = "";
            this.textureAtlasName = "";
            this.skin = null;
        }
    }
    dragonBones.BuildArmaturePackage = BuildArmaturePackage;
})(dragonBones || (dragonBones = {}));
var dragonBones;
(function (dragonBones) {
})(dragonBones || (dragonBones = {}));
