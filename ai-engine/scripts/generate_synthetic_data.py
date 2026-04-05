import pandas as pd
import numpy as np
import random
import os

def generate_synthetic_data(num_samples=10000, output_file='synthetic_interactions.csv'):
    """
    Generates realistic 15-dimensional vectors for User A and User B, alongside a target Match Score.
    This simulates millions of rows of organic swipes/interactions since the MVP has no data.
    """
    print(f"Generating {num_samples} synthetic user interactions...")
    data = []
    
    for _ in range(num_samples):
        # Generate 15 fake features for User A (normalized floats)
        # Features: [age, height, income, caste_id, religion_id, edu_level, dosha_penalty, hobby_1, hobby_2...]
        user_a_features = np.random.rand(15).tolist()
        
        # Fake features for User B
        user_b_features = np.random.rand(15).tolist()
        
        # Create a synthetic label (1 for match, 0 for pass) based on a crude similarity formula 
        # to ensure the Keras model has a pattern to learn.
        similarity = np.dot(user_a_features, user_b_features) / (np.linalg.norm(user_a_features) * np.linalg.norm(user_b_features))
        
        # Add some noise, if similarity > 0.75, likely a match.
        label = 1 if (similarity + random.uniform(-0.1, 0.1)) > 0.75 else 0
        
        data.append(user_a_features + user_b_features + [label])
    
    # Columns naming
    cols_a = [f"A_feature_{i}" for i in range(15)]
    cols_b = [f"B_feature_{i}" for i in range(15)]
    
    df = pd.DataFrame(data, columns=cols_a + cols_b + ["is_match"])
    
    # Save
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    df.to_csv(output_file, index=False)
    print(f"✅ Generated 10,000 synthetic behavioral logs at -> {output_file}")

if __name__ == "__main__":
    generate_synthetic_data(10000, "data/synthetic_interactions.csv")
