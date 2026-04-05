import tensorflow as tf
from tensorflow.keras.layers import Dense, Input, Concatenate, Dropout
from tensorflow.keras.models import Model

def create_two_tower_matchmaker(feature_dim: int = 15):
    """
    Constructs a Two-Tower Deep Neural Network for Recommendation matching.
    Tower A models User A's embedding.
    Tower B models User B's embedding.
    The towers merge into a Dense rating layer that outputs a single match probability [0, 1].
    """
    
    # Tower A: User Profile (Age, Height, Income, Astro Dosha, Hobbies)
    input_a = Input(shape=(feature_dim,), name="user_a_features")
    dense_a1 = Dense(64, activation='relu')(input_a)
    drop_a1 = Dropout(0.2)(dense_a1)
    dense_a2 = Dense(32, activation='relu')(drop_a1)
    
    # Tower B: Candidate Profile 
    input_b = Input(shape=(feature_dim,), name="user_b_features")
    dense_b1 = Dense(64, activation='relu')(input_b)
    drop_b1 = Dropout(0.2)(dense_b1)
    dense_b2 = Dense(32, activation='relu')(drop_b1)
    
    # Merge Encodings
    concat = Concatenate()([dense_a2, dense_b2])
    
    # Deep Final Matcher Layer
    dense_m1 = Dense(32, activation='relu')(concat)
    drop_m1 = Dropout(0.2)(dense_m1)
    dense_m2 = Dense(16, activation='relu')(drop_m1)
    
    # Output Compatibility Score [0 - 1]
    output = Dense(1, activation='sigmoid', name="compatibility_score")(dense_m2)
    
    model = Model(inputs=[input_a, input_b], outputs=output)
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='binary_crossentropy',
        metrics=['accuracy', tf.keras.metrics.AUC()]
    )
    
    return model

if __name__ == "__main__":
    # Test compilation
    ai_matcher = create_two_tower_matchmaker(feature_dim=15)
    ai_matcher.summary()
