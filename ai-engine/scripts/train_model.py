import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from tensorflow.keras.layers import Dense, Input, Concatenate, Dropout
from tensorflow.keras.models import Model
import os

def create_two_tower_matchmaker(feature_dim: int = 15):
    input_a = Input(shape=(feature_dim,), name="user_a_features")
    dense_a1 = Dense(64, activation='relu')(input_a)
    drop_a1 = Dropout(0.2)(dense_a1)
    dense_a2 = Dense(32, activation='relu')(drop_a1)

    input_b = Input(shape=(feature_dim,), name="user_b_features")
    dense_b1 = Dense(64, activation='relu')(input_b)
    drop_b1 = Dropout(0.2)(dense_b1)
    dense_b2 = Dense(32, activation='relu')(drop_b1)

    concat = Concatenate()([dense_a2, dense_b2])
    dense_m1 = Dense(32, activation='relu')(concat)
    drop_m1 = Dropout(0.2)(dense_m1)
    dense_m2 = Dense(16, activation='relu')(drop_m1)

    output = Dense(1, activation='sigmoid', name="compatibility_score")(dense_m2)

    model = Model(inputs=[input_a, input_b], outputs=output)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='binary_crossentropy',
        metrics=['accuracy']
    )
    return model

def train():
    data_path = 'data/synthetic_interactions.csv'
    
    if not os.path.exists(data_path):
        print(f"❌ Error: Could not find training data at {data_path}. Run generate_synthetic_data.py first.")
        return

    print("Loading synthetic interaction logs...")
    df = pd.read_csv(data_path)

    # Split features
    cols_a = [f"A_feature_{i}" for i in range(15)]
    cols_b = [f"B_feature_{i}" for i in range(15)]

    X_a = df[cols_a].values
    X_b = df[cols_b].values
    y = df["is_match"].values

    # Train / Test Split
    X_a_train, X_a_test, X_b_train, X_b_test, y_train, y_test = train_test_split(X_a, X_b, y, test_size=0.2, random_state=42)

    print("Building Keras Two-Tower Network...")
    model = create_two_tower_matchmaker(feature_dim=15)

    print("Training Model across 10 Epochs...")
    history = model.fit(
        x=[X_a_train, X_b_train],
        y=y_train,
        validation_data=([X_a_test, X_b_test], y_test),
        epochs=10,
        batch_size=32,
        verbose=1
    )

    print("Training complete. Evaluating on test set...")
    loss, accuracy = model.evaluate([X_a_test, X_b_test], y_test)
    print(f"Test Accuracy: {accuracy*100:.2f}%")

    model.save("data/model.h5")
    print("✅ Weights successfully saved to data/model.h5. Ready for API Inference.")

if __name__ == "__main__":
    train()
