import { Tag as AntTag, TagProps } from 'antd';
import React from 'react';

type TagComponent = React.FC<TagProps> & {
    CheckableTag: typeof AntTag.CheckableTag;
};

export const Tag = (({ style, ...props }: TagProps) => (
    <AntTag {...props} style={{ borderRadius: 999, ...style }} />
)) as TagComponent;

Tag.CheckableTag = AntTag.CheckableTag;
