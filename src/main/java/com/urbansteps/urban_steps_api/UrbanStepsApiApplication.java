package com.urbansteps.urban_steps_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class UrbanStepsApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(UrbanStepsApiApplication.class, args);
	}

}
