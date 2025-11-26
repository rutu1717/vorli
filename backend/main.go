package main

import (
    "context"
    "fmt"
    "log"
    "google.golang.org/genai"
)

func main() {
    ctx := context.Background()
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }
	const Prompt = "function findLargestNumber(arr) {let largest = 0;for (let i = 0; i <= arr.length; i++) {if (arr[i] > largest) {largest = arr[i];}}return largest;}console.log(findLargestNumber([3, 7, 2, 9, 4])); can you tell how this code works on the machine how variable changes are done actually and one thing dont try to solve that bug , just i want a flow how my current code is working so that i can get an idea "
    result, err := client.Models.GenerateContent(
        ctx,
        "gemini-2.5-flash",
        genai.Text(Prompt),
        nil,
    )
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(result.Text())
}