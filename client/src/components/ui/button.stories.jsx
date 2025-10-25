import React from 'react';
import Button from './button';

export default {
  title: 'UI/Button',
  component: Button,
  args: {
    children: 'Button',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'destructive', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
};

const Template = (args) => <Button {...args} />;

export const Default = Template.bind({});
Default.args = {
  variant: 'default',
};

export const Secondary = Template.bind({});
Secondary.args = {
  variant: 'secondary',
};

export const Outline = Template.bind({});
Outline.args = {
  variant: 'outline',
};

export const Destructive = Template.bind({});
Destructive.args = {
  variant: 'destructive',
};

export const Ghost = Template.bind({});
Ghost.args = {
  variant: 'ghost',
};

export const Link = Template.bind({});
Link.args = {
  variant: 'link',
};
