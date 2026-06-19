//package growth._OK.backend.config;
//
//import org.springframework.boot.test.context.TestConfiguration;
//import org.springframework.context.annotation.Bean;
//import org.springframework.data.redis.core.RedisTemplate;
//import org.springframework.data.redis.core.ValueOperations;
//import org.mockito.Mockito;
//
//@TestConfiguration
//public class TestRedisConfig {
//
//    @Bean
//    @SuppressWarnings("unchecked")
//    public RedisTemplate<String, String> redisTemplate() {
//        RedisTemplate<String, String> template = Mockito.mock(RedisTemplate.class);
//        ValueOperations<String, String> valueOps = Mockito.mock(ValueOperations.class);
//        Mockito.when(template.opsForValue()).thenReturn(valueOps);
//        return template;
//    }
//}
