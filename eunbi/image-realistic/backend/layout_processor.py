"""
Layout Processor: JSON-based furniture positioning and 2D layout generation
Core component of the comprehensive layout preservation system.
"""

import json
import math
from PIL import Image, ImageDraw, ImageFont
from typing import Dict, List, Any, Tuple
import io
import os


class LayoutProcessor:
    """
    Processes JSON layout data to generate precise 2D furniture positioning layouts.
    Ensures perfect furniture position preservation for AI image generation.
    """
    
    def __init__(self):
        self.furniture_colors = {
            'bed': (70, 130, 180),      # Steel blue
            'desk': (160, 82, 45),      # Saddle brown
            'chair': (255, 165, 0),     # Orange
            'wardrobe': (128, 0, 128),  # Purple
            'nightstand': (34, 139, 34), # Forest green
            'dresser': (220, 20, 60),   # Crimson
            'bookshelf': (72, 61, 139), # Dark slate blue
            'table': (255, 140, 0),     # Dark orange
            'sofa': (0, 100, 0),        # Dark green
            'default': (128, 128, 128)  # Gray
        }
    
    def parse_layout_json(self, json_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse and validate JSON layout data
        Returns normalized layout data with validation
        """
        try:
            if 'scene' not in json_data:
                raise ValueError("Missing 'scene' key in JSON data")
            
            scene = json_data['scene']
            room = scene.get('room', {})
            objects = scene.get('objects', [])
            
            # Validate room dimensions
            room_width = float(room.get('width', 400))
            room_depth = float(room.get('depth', 400))
            room_height = float(room.get('height', 250))
            
            # Validate and normalize objects
            normalized_objects = []
            for obj in objects:
                normalized_obj = {
                    'name': obj.get('name', 'Unknown'),
                    'type': obj.get('type', 'default').lower(),
                    'position': [float(x) for x in obj.get('position', [0, 0, 0])],
                    'size': [float(x) for x in obj.get('size', [50, 50, 50])],
                    'rotation_y': float(obj.get('rotation_y', 0))
                }
                normalized_objects.append(normalized_obj)
            
            return {
                'room': {
                    'width': room_width,
                    'depth': room_depth,
                    'height': room_height
                },
                'objects': normalized_objects
            }
            
        except Exception as e:
            raise ValueError(f"Invalid JSON layout data: {str(e)}")
    
    def generate_2d_layout(self, layout_data: Dict[str, Any], 
                          output_size: Tuple[int, int] = (512, 512)) -> bytes:
        """
        Generate precise 2D layout image from JSON data
        Creates top-down view with exact furniture positioning
        """
        room = layout_data['room']
        objects = layout_data['objects']
        
        # Calculate scaling factors
        room_width = room['width']
        room_depth = room['depth']
        
        # Calculate scale to fit in output size with padding
        padding = 50
        available_width = output_size[0] - 2 * padding
        available_height = output_size[1] - 2 * padding
        
        scale_x = available_width / room_width
        scale_y = available_height / room_depth
        scale = min(scale_x, scale_y)  # Use uniform scaling
        
        # Create image
        image = Image.new('RGB', output_size, (255, 255, 255))
        draw = ImageDraw.Draw(image)
        
        # Draw room boundaries
        room_x = padding
        room_y = padding
        room_w = int(room_width * scale)
        room_h = int(room_depth * scale)
        
        # Room outline
        draw.rectangle(
            [room_x, room_y, room_x + room_w, room_y + room_h],
            outline=(0, 0, 0),
            width=3
        )
        
        # Draw furniture
        for obj in objects:
            pos_x, pos_y, pos_z = obj['position']  # pos_y is height, pos_z is depth
            size_x, size_y, size_z = obj['size']   # size_y is height, size_z is depth
            rotation_y = obj['rotation_y']
            furniture_type = obj['type']
            
            # Convert 3D coordinates to 2D top-down view
            # X stays X, Z becomes Y (top-down view)
            center_x = room_x + (pos_x * scale)
            center_y = room_y + (pos_z * scale)
            
            # Furniture dimensions in 2D (width and depth)
            furniture_w = size_x * scale
            furniture_h = size_z * scale
            
            # Apply rotation if needed
            if rotation_y != 0:
                # For rotated furniture, swap width/height if 90° or 270°
                angle = math.radians(rotation_y)
                if abs(math.sin(angle)) > 0.7:  # ~90° or ~270°
                    furniture_w, furniture_h = furniture_h, furniture_w
            
            # Furniture rectangle coordinates
            left = center_x - furniture_w / 2
            top = center_y - furniture_h / 2
            right = center_x + furniture_w / 2
            bottom = center_y + furniture_h / 2
            
            # Get furniture color
            color = self.furniture_colors.get(furniture_type, self.furniture_colors['default'])
            
            # Draw furniture rectangle
            draw.rectangle(
                [left, top, right, bottom],
                fill=color,
                outline=(0, 0, 0),
                width=2
            )
            
            # Add furniture label
            try:
                font = ImageFont.load_default()
            except:
                font = None
            
            label = f"{obj['name']}\n{furniture_type}"
            
            # Calculate text position
            if font:
                bbox = draw.textbbox((0, 0), label, font=font)
                text_w = bbox[2] - bbox[0]
                text_h = bbox[3] - bbox[1]
            else:
                text_w, text_h = 40, 20  # Estimate
            
            text_x = center_x - text_w / 2
            text_y = center_y - text_h / 2
            
            # Draw text background
            draw.rectangle(
                [text_x - 2, text_y - 2, text_x + text_w + 2, text_y + text_h + 2],
                fill=(255, 255, 255, 200)
            )
            
            # Draw text
            draw.text((text_x, text_y), label, fill=(0, 0, 0), font=font)
        
        # Add coordinate grid (optional)
        self._add_coordinate_grid(draw, room_x, room_y, room_w, room_h, scale)
        
        # Convert to bytes
        buffer = io.BytesIO()
        image.save(buffer, format='PNG', quality=95)
        return buffer.getvalue()
    
    def _add_coordinate_grid(self, draw: ImageDraw.ImageDraw, 
                           room_x: int, room_y: int, 
                           room_w: int, room_h: int, scale: float):
        """Add subtle coordinate grid to help with positioning"""
        grid_spacing = max(50 * scale, 20)  # Grid every 50 units or minimum 20px
        
        # Vertical lines
        x = room_x
        while x <= room_x + room_w:
            draw.line([x, room_y, x, room_y + room_h], fill=(200, 200, 200), width=1)
            x += grid_spacing
        
        # Horizontal lines  
        y = room_y
        while y <= room_y + room_h:
            draw.line([room_x, y, room_x + room_w, y], fill=(200, 200, 200), width=1)
            y += grid_spacing
    
    def generate_layout_with_metadata(self, json_data: Dict[str, Any]) -> Tuple[bytes, Dict[str, Any]]:
        """
        Generate layout image with metadata for AI processing
        Returns layout image bytes and metadata dict
        """
        layout_data = self.parse_layout_json(json_data)
        layout_image = self.generate_2d_layout(layout_data)
        
        # Generate metadata for AI processing
        metadata = {
            'furniture_count': len(layout_data['objects']),
            'room_dimensions': layout_data['room'],
            'furniture_positions': [
                {
                    'name': obj['name'],
                    'type': obj['type'],
                    'position': obj['position'],
                    'size': obj['size'],
                    'rotation': obj['rotation_y']
                }
                for obj in layout_data['objects']
            ],
            'layout_constraints': self._generate_constraints(layout_data),
        }
        
        return layout_image, metadata
    
    def _generate_constraints(self, layout_data: Dict[str, Any]) -> List[str]:
        """Generate layout preservation constraints for AI prompts"""
        constraints = [
            f"Room must be exactly {layout_data['room']['width']:.1f}x{layout_data['room']['depth']:.1f} units",
            f"Furniture count must remain exactly {len(layout_data['objects'])} pieces",
        ]
        
        for obj in layout_data['objects']:
            pos_str = f"({obj['position'][0]:.1f}, {obj['position'][2]:.1f})"
            size_str = f"{obj['size'][0]:.1f}x{obj['size'][2]:.1f}"
            constraints.append(
                f"{obj['name']} ({obj['type']}) at position {pos_str}, size {size_str}"
            )
        
        return constraints
    
    def validate_layout_preservation(self, original_json: Dict[str, Any], 
                                   processed_image_path: str = None) -> Dict[str, Any]:
        """
        Validate that layout has been preserved after AI processing
        Returns validation report
        """
        original_data = self.parse_layout_json(original_json)
        
        # TODO: If processed image provided, could use computer vision to verify
        # For now, return constraints that should be validated
        
        return {
            'original_furniture_count': len(original_data['objects']),
            'original_room_size': original_data['room'],
            'preservation_constraints': self._generate_constraints(original_data),
            'validation_status': 'constraints_generated',
            'recommendations': [
                "Verify furniture count matches original",
                "Check room dimensions remain identical",
                "Confirm furniture positions haven't moved",
                "Validate no new furniture has been added"
            ]
        }


# Utility functions for external use
def create_layout_from_json(json_data: Dict[str, Any], size: Tuple[int, int] = (512, 512)) -> bytes:
    """Convenience function to create layout image from JSON data"""
    processor = LayoutProcessor()
    layout_data = processor.parse_layout_json(json_data)
    return processor.generate_2d_layout(layout_data, size)


def extract_furniture_metadata(json_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract furniture positioning metadata for AI prompt generation"""
    processor = LayoutProcessor()
    layout_data = processor.parse_layout_json(json_data)
    
    return {
        'room_dimensions': layout_data['room'],
        'furniture_list': [
            {
                'name': obj['name'],
                'type': obj['type'],
                'position': obj['position'],
                'size': obj['size']
            }
            for obj in layout_data['objects']
        ]
    }